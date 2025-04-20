"use client";

import React, { useState, useRef, useEffect } from 'react';

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get auth token from localStorage on component mount
  useEffect(() => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        console.log('Auth token found');
        setAuthToken(token);
      } else {
        console.warn('No auth token found');
      }
    } catch (error) {
      console.error('Error retrieving auth token:', error);
    }
  }, []);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    validateAndSetFile(selectedFile);
  };
  
  const validateAndSetFile = (selectedFile: File | undefined) => {
    setError(null);
    
    if (!selectedFile) {
      return;
    }
    
    // Check if it's a PDF
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file only.');
      return;
    }
    
    // Check file size (limit to 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size should be less than 10MB.');
      return;
    }
    
    setFile(selectedFile);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    validateAndSetFile(droppedFile);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    
    if (!authToken) {
      setError('You need to be logged in to upload a document.');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      console.log('Uploading file:', file.name);
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });
      
      console.log('Upload response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Upload error:', errorData);
        throw new Error(errorData.detail || 'Failed to upload file');
      }
      
      const data = await response.json();
      console.log('Upload successful:', data);
      
      // Display document ID to the user
      setUploadComplete(true);
      
      // Update localStorage to store the newly created document ID
      const uploadedDoc = {
        id: data.id,
        name: data.name,
        stamped: new Date().toLocaleString(),
        status: data.status,
        size: data.size
      };
      
      try {
        // Try to update the local cache of documents to instantly show in dashboard
        const cachedDocsJson = localStorage.getItem('userDocuments');
        let cachedDocs = cachedDocsJson ? JSON.parse(cachedDocsJson) : [];
        cachedDocs.unshift(uploadedDoc); // Add to the beginning of the array
        localStorage.setItem('userDocuments', JSON.stringify(cachedDocs));
      } catch (err) {
        console.error('Error updating local document cache:', err);
      }
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setFile(null);
        setUploadComplete(false);
        
        // Reload the page to refresh the documents list
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      setError('An error occurred while uploading. Please try again.');
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div className="w-full">
      {!authToken && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
          <p>You need to be logged in to upload and stamp documents.</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="w-full">
        <div 
          className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center 
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} 
            ${error ? 'border-red-300' : ''} 
            transition-colors cursor-pointer`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileInput}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange} 
            className="hidden" 
            accept=".pdf" 
          />
          
          {!file && !uploadComplete && (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg font-medium mb-2">Drag & Drop your PDF here</p>
              <p className="text-gray-500 text-center">or click to browse your files</p>
            </>
          )}
          
          {file && !uploadComplete && !isUploading && (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium mb-1">File selected:</p>
              <p className="text-gray-500 mb-4">{file.name}</p>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  Change
                </button>
              </div>
            </>
          )}
          
          {isUploading && (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-lg font-medium">Uploading and stamping...</p>
            </div>
          )}
          
          {uploadComplete && (
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-lg font-medium text-green-600">Document stamped successfully!</p>
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-red-500 mt-2">{error}</p>
        )}
        
        {file && !uploadComplete && !isUploading && (
          <button
            type="submit"
            disabled={!authToken}
            className={`w-full mt-6 ${
              authToken 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-400 cursor-not-allowed'
            } text-white py-3 px-6 rounded-lg font-medium transition-colors`}
          >
            Stamp Document
          </button>
        )}
      </form>
    </div>
  );
} 