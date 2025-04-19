/**
 * EurekaInvoiceRegistry Contract ABI
 */

const contractAbi = [
  // Read methods
  "function getInvoice(string calldata) external view returns (tuple(bytes32,string,address,uint256,bool,bool))",
  "function shaExists(bytes32) external view returns (bool)",
  "function owner() external view returns (address)",
  "function whitelist(address) external view returns (bool)",
  "function paused() external view returns (bool)",
  
  // Write methods 
  "function submitInvoice(bytes32 sha256Hash, string calldata hashcode) external",
  "function completeInvoice(string calldata hashcode) external",
  "function revokeInvoice(string calldata hashcode) external",
  "function addSigner(address signer) external",
  "function removeSigner(address signer) external",
  
  // Events
  "event InvoiceSubmitted(string indexed hashcode, address indexed issuer, uint256 timestamp)",
  "event InvoiceCompleted(string indexed hashcode, address indexed issuer)",
  "event InvoiceRevoked(string indexed hashcode, address indexed issuer)"
];

export default contractAbi; 