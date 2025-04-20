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

// Define a more user-friendly invoice format for the frontend
export interface VerificationResult {
  isValid: boolean;
  status: 'paid' | 'unpaid' | 'revoked' | 'unknown' | 'active' | 'completed';
  payee?: string;
  timestamp?: number;
  hash?: string;      // Blockchain transaction hash
  code?: string;      // Invoice code/hashcode
  useMockData?: boolean; // Flag to indicate if using mock data
  connectionError?: boolean; // Flag to indicate blockchain connection error
}

// The API URL from environment or default to localhost
const API_BASE_URL = process.env.NEXT_PUBLIC_BLOCKCHAIN_API_URL || 'http://localhost:3001/api';

/**
 * Formats a user-friendly invoice code to the blockchain format
 * The contract requires INV-XXXX-XXXX format
 * @param code User-entered verification code
 * @returns Formatted code for blockchain query
 */
const formatVerificationCode = (code: string): string => {
  // Remove any spaces or non-alphanumeric characters
  const cleanCode = code.replace(/[^a-zA-Z0-9-]/g, '');
  
  // If the code is already in INV-XXXX-XXXX format, return it as is
  if (cleanCode.startsWith('INV-') && cleanCode.length === 13) {
    return cleanCode;
  }
  
  // If the code is in T4R7-L9P1 format (9 chars with a hyphen)
  if (cleanCode.includes('-') && cleanCode.length === 9) {
    return `INV-${cleanCode}`;
  }
  
  // If the code is 8 characters (like T4R7L9P1)
  if (cleanCode.length === 8) {
    return `INV-${cleanCode.substring(0, 4)}-${cleanCode.substring(4, 8)}`;
  }
  
  // If the code is 4 characters (partial code)
  if (cleanCode.length === 4) {
    return `INV-${cleanCode}-????`;
  }
  
  // Otherwise, prefix with INV- but it will likely fail validation
  return `INV-${cleanCode}`;
};

/**
 * Verify an invoice by code from the blockchain
 * @param code The verification code (either 8 digits or INV-XXXX-XXXX format)
 * @param useMockData Whether to use mock data instead of real data
 * @returns Promise with verification result
 */
export async function verifyInvoice(code: string, useMockData = false): Promise<VerificationResult> {
  // If using mock data, return a predefined response
  if (useMockData) {
    return {
      isValid: true,
      status: 'unpaid',
      payee: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
      timestamp: Math.floor(Date.now() / 1000),
      hash: '0x7c5ea36004851c764c44143b1dcf59613d3daa99e93b1856774b9a04479d9385',
      code: formatVerificationCode(code),
      useMockData: true,
      connectionError: false
    };
  }
  
  // Format the code for blockchain query
  const formattedCode = formatVerificationCode(code);
  
  try {
    // Call the blockchain API
    console.log(`Fetching from API: ${API_BASE_URL}/contract/invoice/${formattedCode}`);
    const response = await fetch(`${API_BASE_URL}/contract/invoice/${formattedCode}`);
    
    if (!response.ok) {
      console.error(`API error: ${response.status}`);
      return {
        isValid: false,
        status: 'unknown',
        connectionError: true,
        code: formattedCode,
        useMockData: false
      };
    }
    
    const invoice: BlockchainInvoice = await response.json();
    console.log('API returned:', invoice);
    
    // Check if the invoice was found (timestamp will be 0 if not found)
    if (!invoice || !invoice.timestamp || invoice.timestamp === 0) {
      return {
        isValid: false,
        status: 'unknown',
        connectionError: false,
        code: formattedCode,
        useMockData: false
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
      connectionError: false,
      useMockData: false
    };
  } catch (error) {
    console.error('Error verifying invoice:', error);
    return {
      isValid: false,
      status: 'unknown',
      connectionError: true,
      code: formattedCode,
      useMockData: false
    };
  }
} 