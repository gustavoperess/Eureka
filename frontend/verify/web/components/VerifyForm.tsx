"use client";

import { FormEvent, useState, useRef, ChangeEvent, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { verifyInvoice, VerificationResult } from '../services/blockchainService';
import VerifyResult from './VerifyResult';

export default function VerifyForm() {
  const searchParams = useSearchParams();
  const [hash, setHash] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isComputingHash, setIsComputingHash] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [showingResults, setShowingResults] = useState(false);
  const [useMockData, setUseMockData] = useState(false);

  // Check for code in URL parameters when component mounts
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      console.log('Code found in URL:', codeFromUrl);
      setHash(codeFromUrl);
      
      // Auto-verify the code from URL
      verifyCodeFromUrl(codeFromUrl);
    }
  }, [searchParams, useMockData]);

  // Function to verify a code provided in the URL
  const verifyCodeFromUrl = async (code: string) => {
    if (!code.trim()) return;

    setIsVerifying(true);
    setVerificationResult(null);
    
    try {
      // Use the blockchain API to verify the invoice
      const result = await verifyInvoice(code.trim(), useMockData);
      setVerificationResult(result);
      setShowingResults(true);
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationResult({
        isValid: false,
        status: 'unknown',
        useMockData,
        connectionError: true
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!hash.trim()) return;

    setIsVerifying(true);
    setVerificationResult(null);
    
    try {
      // Use the blockchain API to verify the invoice
      const result = await verifyInvoice(hash.trim(), useMockData);
      setVerificationResult(result);
      setShowingResults(true);
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationResult({
        isValid: false,
        status: 'unknown',
        useMockData,
        connectionError: true
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyAnother = () => {
    setShowingResults(false);
    setVerificationResult(null);
    setHash('');
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setUploadedFile(file);
    await computeHash(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setUploadedFile(file);
    await computeHash(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const computeHash = async (file: File) => {
    setIsComputingHash(true);
    
    try {
      // Read the file as an ArrayBuffer
      const buffer = await file.arrayBuffer();
      
      // Use the Web Crypto API to compute the SHA-256 hash
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      
      // Convert the hash to a hex string
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      setHash(hashHex);
    } catch (error) {
      console.error('Error computing hash:', error);
      alert('Error computing hash. Please try again.');
    } finally {
      setIsComputingHash(false);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Toggle mock data state
  const toggleMockData = () => {
    setUseMockData(!useMockData);
  };

  // If we have verification results, show the results page
  if (showingResults && verificationResult) {
    return <VerifyResult result={verificationResult} onVerifyAnother={handleVerifyAnother} />;
  }

  // Otherwise show the form
  return (
    <div id="verify-section" className="w-full max-w-md mx-auto relative">
      {/* Mock data toggle */}
      <div className="absolute right-0 top-0 transform translate-x-2 -translate-y-12">
        <label className="inline-flex items-center cursor-pointer">
          <span className="mr-2 text-sm text-gray-700">
            {useMockData ? 'Using Mock Data' : 'Using Real Data'}
          </span>
          <div className="relative">
            <input 
              type="checkbox" 
              checked={useMockData} 
              onChange={toggleMockData} 
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
          </div>
        </label>
      </div>
      
      {/* Light blue glow effect in the background */}
      <div className="absolute -inset-10 bg-blue-500/10 rounded-full blur-3xl opacity-50 -z-10"></div>
      
      <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Verify Your Bill</h2>
        
        <div className="mb-6">
          <label htmlFor="hash" className="block text-gray-700 text-sm font-medium mb-2">
            Enter Bill Hash or Code
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              id="hash"
              placeholder="Enter code XXXX-XXXX"
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">Enter the unique code found on your bill (e.g. T4R7-L9P1)</p>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={isVerifying || isComputingHash}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isVerifying ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </>
            ) : 'Verify Bill'}
          </button>
        </div>
      </form>
      
      <div 
        className="mt-6 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors cursor-pointer bg-gray-50"
        onClick={triggerFileInput}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange}
          accept="application/pdf"
          className="hidden"
        />
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="font-medium">Upload PDF or drag and drop</span>
          </div>
          <p className="text-xs text-gray-500">Only PDF files are supported</p>
          
          {isComputingHash && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm text-blue-500">Computing hash...</span>
            </div>
          )}
          
          {uploadedFile && !isComputingHash && (
            <div className="mt-3">
              <div className="bg-blue-50 p-2 rounded text-sm flex items-center gap-2 max-w-full overflow-hidden">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="truncate" title={uploadedFile.name}>{uploadedFile.name}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 