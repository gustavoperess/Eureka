"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import UploadForm from '../../components/UploadForm';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';

export default function Dashboard() {
  const { user, userType, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('upload');
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if the user is gustavomoreira@edutech.com for personalized experience
  const isGustavoAccount = user?.email === 'gustavomoreira@edutech.com';
  
  // Mock blockchain data for timestamp
  const blockchainStampData = {
    timestamp: "2023-11-05T14:32:17Z",
    block: 25483921,
    txHash: "0x7a9d5d3c8dca2c9e8b9fa61eb9c0d1d308c13b92dccb0d13f11b3df9b80ba704"
  };
  
  // Format date from blockchain timestamp
  const formatBlockchainDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const [documents, setDocuments] = useState<any[]>([]);
  
  // Function to fetch documents from the API
  const fetchUserDocuments = async () => {
    if (!user) return;
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const authToken = localStorage.getItem('authToken');
      
      if (!authToken) {
        console.warn('No auth token found');
        return;
      }
      
      const response = await fetch(`${API_URL}/documents`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      
      const data = await response.json();
      console.log('Fetched documents:', data);
      
      // Store in localStorage for quicker loading on next visit
      localStorage.setItem('userDocuments', JSON.stringify(data));
      
      return data;
    } catch (error) {
      console.error('Error fetching documents:', error);
      
      // Try to get from localStorage as fallback
      const cachedDocs = localStorage.getItem('userDocuments');
      if (cachedDocs) {
        return JSON.parse(cachedDocs);
      }
      return [];
    }
  };
  
  // Load documents based on user
  useEffect(() => {
    const loadDocuments = async () => {
      setIsLoading(true);
      
      // Example documents (always shown)
      let exampleDocs = [];
      
      if (isGustavoAccount) {
        // Custom docs for Gustavo
        exampleDocs = [
          {
            id: 'inv-2025-2004',
            name: 'INV-2025-2004.pdf',
            stamped: '20/04/2025, 06:21:00 UTC',
            status: 'active',
            txHash: blockchainStampData.txHash,
            size: '1.7 MB'
          },
          {
            id: 'inv-2025-0420',
            name: 'INV-2025-0420.pdf',
            stamped: '20/04/2025, 09:47:12 UTC',
            status: 'revoked',
            txHash: '0x9c4d5f2e8bda1d9e7b0fa61fb8c0f2d409c15b94eccb0d13f22b5df9b80ba502',
            size: '1.5 MB'
          },
          {
            id: 'inv-2025-0421',
            name: 'INV-2025-0421.pdf',
            stamped: '20/04/2025, 09:53:12 UTC',
            status: 'completed',
            txHash: '0x8b3d6f1c7deb2c8f9b0ea72fb7c0f3e508d13a91ffcb0d13f33b7df9b80ba303',
            size: '1.6 MB'
          }
        ];
      } else {
        // Default docs for other users
        exampleDocs = [
          {
            id: 'doc-12345',
            name: 'Contract-2023.pdf',
            stamped: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            status: 'verified',
            size: '1.2 MB'
          },
          {
            id: 'doc-67890',
            name: 'Invoice-April2023.pdf',
            stamped: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            status: 'verified',
            size: '0.8 MB'
          }
        ];
      }
      
      // First try to get cached documents for quick loading
      const cachedDocs = localStorage.getItem('userDocuments');
      let userDocs = cachedDocs ? JSON.parse(cachedDocs) : [];
      
      // Then fetch from API and update later
      const apiDocs = await fetchUserDocuments();
      
      if (apiDocs && apiDocs.length > 0) {
        // Format API documents to match our UI format
        userDocs = apiDocs.map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          stamped: new Date(doc.timestamp).toLocaleString(),
          status: doc.status,
          size: doc.size,
          txHash: doc.txHash
        }));
      }
      
      // Combine user docs and example docs
      setDocuments([...userDocs, ...exampleDocs]);
      setIsLoading(false);
    };
    
    // Reduced delay for better UX
    const timer = setTimeout(loadDocuments, 500);
    return () => clearTimeout(timer);
  }, [user]);
  
  // Handle view document (redirect to verify page)
  const handleViewDocument = (documentId: string) => {
    console.log(`Redirecting to verify website for document: ${documentId}`);
    
    // Format the document ID for the verify website
    let formattedCode;
    
    // Special handling for Gustavo's invoice
    if (documentId === 'inv-2025-2004') {
      // Use the actual invoice code format expected by the verify website
      formattedCode = 'INV-2025-2004';
    } else {
      // For other documents, format as needed
      formattedCode = documentId;
    }
    
    // Redirect to the external verify website running on port 5000
    window.open(`http://localhost:5000?code=${formattedCode}`, '_blank');
  };
  
  // Function to safely get the user name
  const getUserDisplayName = () => {
    if (!user) return '';
    if (userType === 'company' && 'name' in user) {
      return user.name;
    } else if (userType === 'user' && 'fullName' in user) {
      return user.fullName;
    }
    return isGustavoAccount ? 'Gustavo Moreira' : '';
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        {/* User info header */}
        <div className="bg-white shadow rounded-lg p-4 mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Welcome{user ? `, ${getUserDisplayName()}` : ''}!</h2>
            <p className="text-gray-600 text-sm">{user?.email || 'gustavomoreira@edutech.com'}</p>
            {isGustavoAccount && (
              <p className="text-blue-600 text-xs mt-1">EduTech Solutions • Premium Account</p>
            )}
          </div>
          <button 
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Dashboard content */}
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
        {/* Upload section with UploadForm */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
          <p className="text-gray-600 mb-4">
            Upload a document to stamp it with blockchain technology.
          </p>
          <UploadForm />
        </div>
        
        {/* Recent documents section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Documents</h2>
          {!isLoading && documents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stamped Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                            <div className="text-sm text-gray-500">{doc.size}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{doc.stamped}</div>
                        {doc.txHash && (
                          <div className="text-xs text-gray-500 truncate max-w-xs" title={doc.txHash}>
                            TX: {doc.txHash.substring(0, 10)}...
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          doc.status === 'verified' ? 'bg-green-100 text-green-800' : 
                          doc.status === 'active' ? 'bg-blue-100 text-blue-800' :
                          doc.status === 'completed' ? 'bg-green-100 text-green-800' :
                          doc.status === 'revoked' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {doc.status === 'verified' ? 'Verified' : 
                           doc.status === 'active' ? 'Active' :
                           doc.status === 'completed' ? 'Completed' :
                           doc.status === 'revoked' ? 'Revoked' :
                           'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button 
                          onClick={() => handleViewDocument(doc.id)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Verify
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>{isLoading ? 'Loading your documents...' : 'No documents found'}</p>
              {isLoading && 
                <div className="mt-2 w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mx-auto"></div>
              }
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 