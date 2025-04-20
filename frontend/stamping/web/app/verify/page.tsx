"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const docId = searchParams.get('docId');
  
  const [verificationData, setVerificationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for Gustavo's invoice
  const invoiceData = {
    id: 'inv-2025-2004',
    name: 'INV-2025-2004.pdf',
    hash: '0xd7a3c9c4d8e6b2f1a8d6e9c2a3f5b7d8a9c2e5f3a6b9d8a1c5f7e2a3b9c8d7f6a1',
    transaction: {
      hash: '0x7a9d5d3c8dca2c9e8b9fa61eb9c0d1d308c13b92dccb0d13f11b3df9b80ba704',
      blockNumber: 25483921,
      timestamp: '2023-11-05T14:32:17Z',
      network: 'Polkadot',
      explorer: 'https://dotscanner.com/Polkadot/transaction/0x7a9d5d3c8dca2c9e8b9fa61eb9c0d1d308c13b92dccb0d13f11b3df9b80ba704'
    },
    issuer: {
      name: 'EduTech Solutions',
      email: 'gustavomoreira@edutech.com'
    },
    recipient: {
      name: 'Polkadot Academy',
      email: 'accounts@polkadotacademy.edu'
    },
    amount: '$2,500.00',
    issueDate: '2023-11-05',
    dueDate: '2023-12-05'
  };

  // Simple document data for other documents
  const defaultDocData = {
    id: docId,
    name: `${docId}.pdf`,
    hash: '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    transaction: {
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      blockNumber: 12345678,
      timestamp: new Date().toISOString(),
      network: 'Polkadot',
      explorer: 'https://dotscanner.com/'
    }
  };

  useEffect(() => {
    // Simulate API fetch delay
    const timeout = setTimeout(() => {
      setLoading(false);
      
      if (!docId) {
        setError('No document ID provided');
        return;
      }
      
      // Use specific data for Gustavo's invoice
      if (docId === 'inv-2025-2004') {
        setVerificationData(invoiceData);
      } else {
        setVerificationData(defaultDocData);
      }
    }, 1500);
    
    return () => clearTimeout(timeout);
  }, [docId]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-medium text-gray-700">Verifying document...</h2>
        <p className="text-gray-500 mt-2">Checking blockchain records</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 max-w-md w-full">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 mt-4">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  if (!verificationData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 max-w-md w-full">
          <p className="font-bold">Document Not Found</p>
          <p>The requested document could not be verified.</p>
        </div>
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 mt-4">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Document Verification</h1>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Blockchain verification details
              </p>
            </div>
            <Link 
              href="/dashboard" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              Back to Dashboard
            </Link>
          </div>
          
          {/* Status Banner */}
          <div className="bg-green-50 px-4 py-3 border-t border-b border-green-200">
            <div className="flex items-center">
              <svg className="h-6 w-6 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-700 font-medium">Document verified on blockchain</p>
            </div>
          </div>

          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Document Name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{verificationData.name}</dd>
              </div>
              
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Document Hash</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 break-all">
                  {verificationData.hash}
                </dd>
              </div>
              
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Transaction Hash</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 break-all">
                  <a 
                    href={verificationData.transaction.explorer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {verificationData.transaction.hash}
                  </a>
                </dd>
              </div>
              
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Block Number</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {verificationData.transaction.blockNumber.toLocaleString()}
                </dd>
              </div>
              
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Timestamp</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {formatDate(verificationData.transaction.timestamp)}
                </dd>
              </div>
              
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Blockchain Network</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {verificationData.transaction.network}
                </dd>
              </div>
              
              {/* Invoice-specific data */}
              {docId === 'inv-2025-2004' && (
                <>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Issuer</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {verificationData.issuer.name} ({verificationData.issuer.email})
                    </dd>
                  </div>
                  
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Recipient</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {verificationData.recipient.name} ({verificationData.recipient.email})
                    </dd>
                  </div>
                  
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Amount</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-semibold">
                      {verificationData.amount}
                    </dd>
                  </div>
                  
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Issue Date</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {verificationData.issueDate}
                    </dd>
                  </div>
                  
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {verificationData.dueDate}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
} 