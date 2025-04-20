/**
 * Blockchain integration service for invoice verification
 */

// Define the structure of an invoice response from the blockchain
export interface BlockchainInvoice {
  hash: string;
  hashcode: string;
  issuer: string;
  timestamp: number;
  revoked: boolean;
  completed: boolean;
  status: string;
}

// Define the structure for documents stored in the backend JSON
export interface BackendDocument {
  id: string;           // Format: INV-XXXX-XXXX
  name: string;         // Document name
  original_filename: string;
  file_hash: string;    // SHA256 hash
  file_path: string;
  user_id: string;
  user_email: string;
  user_name?: string;
  timestamp: string;    // ISO date string
  status: string;
  size?: string;
}

// Define a more user-friendly invoice format for the frontend
export interface VerificationResult {
  isValid: boolean;
  status: 'paid' | 'unpaid' | 'revoked' | 'unknown' | 'active' | 'completed';
  payee?: string;
  timestamp?: number;
  hash?: string;      // Blockchain transaction hash or file hash
  code?: string;      // Invoice code/hashcode
  connectionError?: boolean; // Flag to indicate blockchain connection error
  fromBackup?: boolean; // Flag to indicate if data came from JSON backup
}

// The API URL from environment or default to localhost
const API_BASE_URL = process.env.NEXT_PUBLIC_BLOCKCHAIN_API_URL || 'http://localhost:3001/api';
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Formats a user-friendly invoice code to the blockchain format
 * The contract requires INV-XXXX-XXXX format
 * @param code User-entered verification code
 * @returns Formatted code for blockchain query
 */
const formatVerificationCode = (code: string): string => {
  // Remove any spaces or non-alphanumeric characters except hyphen
  let cleanCode = code.replace(/[^a-zA-Z0-9-]/g, '');
  
  // If the code ends with .pdf (case insensitive), remove it
  if (code.toLowerCase().endsWith('.pdf')) {
    cleanCode = cleanCode.slice(0, -4);
  }
  
  // If the code is already in INV-XXXX-XXXX format, return it as is
  if (/^INV-\d{4}-\d{4}$/i.test(cleanCode)) {
    return cleanCode.toUpperCase();
  }
  
  // If the code is in T4R7-L9P1 format (9 chars with a hyphen)
  if (cleanCode.includes('-') && cleanCode.length === 9) {
    return `INV-${cleanCode}`.toUpperCase();
  }
  
  // If the code is 8 characters (like T4R7L9P1)
  if (cleanCode.length === 8) {
    return `INV-${cleanCode.substring(0, 4)}-${cleanCode.substring(4, 8)}`.toUpperCase();
  }
  
  // If the code is 4 characters (partial code)
  if (cleanCode.length === 4) {
    return `INV-${cleanCode}-????`.toUpperCase();
  }
  
  // Otherwise, prefix with INV- but it will likely fail validation
  return `INV-${cleanCode}`.toUpperCase();
};

/**
 * Check the backend JSON file for the document as a fallback
 * @param code The verification code in INV-XXXX-XXXX format
 * @returns Promise with verification result or null if not found
 */
async function checkBackendJson(code: string): Promise<VerificationResult | null> {
  try {
    console.log(`Checking backend JSON for document: ${code}`);
    
    // Call the backend API to get document by ID
    const response = await fetch(`${BACKEND_API_URL}/document/${code}`);
    
    if (!response.ok) {
      console.log(`Document not found in backend: ${response.status}`);
      return null;
    }
    
    const document: BackendDocument = await response.json();
    console.log('Backend returned document:', document);
    
    if (!document || !document.id) {
      return null;
    }
    
    // Convert document status to verification status
    let status: 'paid' | 'unpaid' | 'revoked' | 'unknown' | 'active' | 'completed' = 'unpaid';
    if (document.status) {
      const docStatus = document.status.toLowerCase();
      if (docStatus === 'completed') status = 'completed';
      else if (docStatus === 'revoked') status = 'revoked';
      else status = 'unpaid';
    }
    
    // Convert ISO timestamp string to Unix timestamp
    const timestampMs = document.timestamp ? new Date(document.timestamp).getTime() : Date.now();
    const timestamp = Math.floor(timestampMs / 1000);
    
    return {
      isValid: true,
      status,
      payee: document.user_email,
      timestamp,
      hash: document.file_hash,
      code: document.id,
      fromBackup: true
    };
  } catch (error) {
    console.error('Error checking backend JSON:', error);
    return null;
  }
}

/**
 * Verify an invoice by code from the blockchain
 * @param code The verification code (either 8 digits or INV-XXXX-XXXX format)
 * @returns Promise with verification result
 */
export async function verifyInvoice(code: string): Promise<VerificationResult> {
  // Format the code for blockchain query
  const formattedCode = formatVerificationCode(code);
  
  try {
    // Call the blockchain API
    console.log(`Fetching from API: ${API_BASE_URL}/contract/invoice/${formattedCode}`);
    
    const response = await fetch(`${API_BASE_URL}/contract/invoice/${formattedCode}`);
    
    if (!response.ok) {
      console.error(`API error: ${response.status}`);
      
      // Try fallback to backend JSON
      const backendResult = await checkBackendJson(formattedCode);
      if (backendResult) {
        console.log('Found document in backend JSON');
        return backendResult;
      }
      
      // If not found anywhere, return invalid
      return {
        isValid: false,
        status: 'unknown',
        code: formattedCode,
        connectionError: false
      };
    }
    
    const invoice: BlockchainInvoice = await response.json();
    console.log('API returned:', invoice);
    
    // Check if the invoice was found (timestamp will be 0 if not found)
    if (!invoice || !invoice.timestamp || invoice.timestamp === 0) {
      // Try fallback to backend JSON
      const backendResult = await checkBackendJson(formattedCode);
      if (backendResult) {
        console.log('Found document in backend JSON');
        return backendResult;
      }
      
      // If not found anywhere, return invalid
      return {
        isValid: false,
        status: 'unknown',
        code: formattedCode,
        connectionError: false
      };
    }
    
    // Convert blockchain status to frontend status
    let status: 'paid' | 'unpaid' | 'revoked' | 'unknown' | 'active' | 'completed' = 'unknown';
    
    if (invoice.completed) {
      status = 'completed';
    } else if (invoice.revoked) {
      status = 'revoked';
    } else {
      status = 'unpaid';
    }
    
    return {
      isValid: true,
      status,
      payee: invoice.issuer,
      timestamp: invoice.timestamp,
      hash: invoice.hash,
      code: invoice.hashcode,
      connectionError: false
    };
  } catch (error) {
    console.error('Error verifying invoice:', error);
    
    // Try fallback to backend JSON if we have a connection error
    const backendResult = await checkBackendJson(formattedCode);
    if (backendResult) {
      console.log('Found document in backend JSON');
      return backendResult;
    }
    
    // If nothing works, return as invalid
    return {
      isValid: false,
      status: 'unknown',
      code: formattedCode,
      connectionError: true
    };
  }
} 