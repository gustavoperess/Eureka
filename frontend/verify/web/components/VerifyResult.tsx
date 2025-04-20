import React from 'react';
import { VerificationResult } from '../services/blockchainService';

interface VerifyResultProps {
  result: VerificationResult;
  onVerifyAnother: () => void;
}

export default function VerifyResult({ result, onVerifyAnother }: VerifyResultProps) {
  // Format the timestamp to a readable date
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };

  // Format blockchain addresses to shortened form
  const formatAddress = (address?: string) => {
    if (!address) return 'Unknown';
    if (address.length > 16) {
      return `${address.substring(0, 8)}...${address.substring(address.length - 4)}`;
    }
    return address;
  };

  // Get transaction ID from the hash
  const getTransactionId = (hash?: string) => {
    if (!hash) return 'Unknown';
    if (hash.length > 30) {
      return `${hash.substring(0, 16)}...`;
    }
    return hash;
  };

  // Get the appropriate background color based on verification result
  const getStatusBackgroundColor = () => {
    if (!result.isValid) return 'bg-red-100'; // Invalid always gets red
    
    // For valid results, check the status
    switch (result.status) {
      case 'paid':
      case 'completed':
        return 'bg-orange-100'; // Verified and completed = Orange
      case 'revoked':
        return 'bg-red-100'; // Verified but revoked = Red
      case 'unpaid':
      case 'active':
      default:
        return 'bg-green-100'; // Active and verified = Green
    }
  };

  // Get the appropriate text color based on verification result
  const getStatusTextColor = () => {
    if (!result.isValid) return 'text-red-800'; // Invalid always gets red
    
    // For valid results, check the status
    switch (result.status) {
      case 'paid':
      case 'completed':
        return 'text-orange-800'; // Verified and completed = Orange
      case 'revoked':
        return 'text-red-800'; // Verified but revoked = Red
      case 'unpaid':
      case 'active':
      default:
        return 'text-green-800'; // Active and verified = Green
    }
  };

  // Notice for connection errors
  const ConnectionErrorIndicator = () => (
    <div className="bg-red-100 p-2 mt-2 rounded-md text-sm text-red-800">
      <span className="font-bold">Connection Error:</span> Could not connect to the blockchain. Using fallback data.
    </div>
  );

  // Notice for backup source
  const BackupSourceIndicator = () => (
    <div className="bg-blue-100 p-2 mt-2 rounded-md text-sm text-blue-800">
      <span className="font-bold">Data Source:</span> Document verified from server records.
    </div>
  );

  // Get status display text
  const getStatusDisplay = () => {
    if (!result.isValid) return 'INVALID';
    
    switch (result.status) {
      case 'active':
        return 'UNPAID';
      default:
        return result.status.toUpperCase();
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-2xl mx-auto">
      {/* Verification Status Header */}
      <div className={`p-4 ${getStatusBackgroundColor()}`}>
        <h2 className="text-lg font-bold">
          VERIFIED STATUS: <span className={getStatusTextColor()}>{getStatusDisplay()}</span>
        </h2>
        <div className="mt-2">
          <p className="text-sm"><strong>Date:</strong> {formatDate(result.timestamp)}</p>
        </div>
        {result.connectionError && <ConnectionErrorIndicator />}
        {result.fromBackup && <BackupSourceIndicator />}
      </div>

      {/* Document Information */}
      <div className="p-4 border-b">
        <h3 className="font-medium text-gray-800 mb-3">Document Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Document Hash</p>
            <p className="font-mono text-sm">{result.code || 'INV-XXXX-XXXX'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Verification Source</p>
            <p className="font-mono text-sm">{result.fromBackup ? 'Server Records' : 'Polkadot Blockchain'}</p>
          </div>
        </div>
      </div>

      {/* Timestamp Information */}
      <div className="p-4 border-b">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Timestamp</p>
            <p className="font-mono text-sm">
              {result.timestamp 
                ? new Date(result.timestamp * 1000).toLocaleString() + ' UTC'
                : 'Unknown'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{result.fromBackup ? 'File Hash' : 'Transaction ID'}</p>
            <p className="font-mono text-sm truncate" title={result.hash}>
              {getTransactionId(result.hash)}
            </p>
          </div>
        </div>
      </div>

      {/* Document Details */}
      <div className="p-4 border-b">
        <h3 className="font-medium text-gray-800 mb-3">Verification Details</h3>
        <div className="space-y-2">
          <div>
            <p className="text-sm text-gray-600">Document Type</p>
            <p className="text-sm">Invoice</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Verification System</p>
            <p className="text-sm">{result.fromBackup ? 'Server Records' : 'Polkadot EVM Invoice Registry'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <p className={`text-sm font-semibold ${getStatusTextColor()}`}>{getStatusDisplay()}</p>
          </div>
          {result.payee && (
            <div>
              <p className="text-sm text-gray-600">{result.fromBackup ? 'Owner Email' : 'Issuer Address'}</p>
              <p className="text-sm font-mono">{formatAddress(result.payee)}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600">Valid Until</p>
            <p className="text-sm">Permanent</p>
          </div>
        </div>
      </div>

      {/* Button */}
      <div className="p-4 flex justify-center">
        <button
          onClick={onVerifyAnother}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
        >
          Verify Another Document
        </button>
      </div>
    </div>
  );
} 