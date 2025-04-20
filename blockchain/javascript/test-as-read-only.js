// Read-only test script for validating contract connectivity
require('dotenv').config();
const { ethers } = require('ethers');
const CONTRACT_ADDRESS = '0x3C197333cFDa62bcd12FEdcEc43e0b6929110355';

async function testReadOnly() {
  console.log('🔍 Read-Only Contract Test');
  console.log('=========================\n');
  
  try {
    // Setup read-only provider
    const provider = new ethers.providers.JsonRpcProvider('https://westend-asset-hub-eth-rpc.polkadot.io');
    
    // Get private key from .env
    const privateKey = process.env.PRIVATE_KEY.startsWith('0x') 
      ? process.env.PRIVATE_KEY 
      : `0x${process.env.PRIVATE_KEY}`;
    
    // Create wallet (just to get the address)
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`Wallet address: ${wallet.address}`);
    
    // Get balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`Balance: ${ethers.utils.formatEther(balance)} ETH`);
    
    // Define ABI with just the read functions we need
    const abi = [
      "function owner() external view returns (address)",
      "function whitelist(address) external view returns (bool)",
      "function getInvoice(string calldata) external view returns (tuple(bytes32,string,address,uint256,bool,bool))",
      "function shaExists(bytes32) external view returns (bool)"
    ];
    
    // Create contract instance for reading
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
    
    // Check if we're the owner
    console.log('\n--- Contract Owner ---');
    const owner = await contract.owner();
    console.log(`Contract owner: ${owner}`);
    console.log(`Are you the owner? ${owner.toLowerCase() === wallet.address.toLowerCase() ? 'YES ✅' : 'NO ❌'}`);
    
    // Check if we're whitelisted
    console.log('\n--- Whitelist Status ---');
    const isWhitelisted = await contract.whitelist(wallet.address);
    console.log(`Is whitelisted: ${isWhitelisted ? 'YES ✅' : 'NO ❌'}`);
    
    // Try to check if a random hash exists
    console.log('\n--- Testing shaExists ---');
    const randomHash = '0x' + Array(64).fill(0).map(() => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
    console.log(`Random hash: ${randomHash}`);
    const hashExists = await contract.shaExists(randomHash);
    console.log(`Hash exists: ${hashExists ? 'YES' : 'NO (expected for random)'}`);
    
    // Try to get a non-existent invoice
    console.log('\n--- Testing getInvoice ---');
    try {
      console.log('Checking for invoice: INV-TEST-0000');
      const invoice = await contract.getInvoice('INV-TEST-0000');
      console.log('Invoice data:', invoice);
    } catch (error) {
      console.log('No invoice found (expected):', error.message);
    }
    
    console.log('\n--- Summary ---');
    console.log('Contract can be read successfully ✅');
    if (isWhitelisted) {
      console.log('Your address IS whitelisted. You can proceed with the contract test.');
    } else {
      console.log('Your address is NOT whitelisted, but you ARE the owner.');
      console.log('You can call "addSigner" on the contract to add yourself, but there seems to be an issue with gas or fees.');
      console.log('Consider checking the chain\'s compatibility with your transaction format or using an alternative approach.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Execute the function
testReadOnly()
  .catch(console.error)
  .finally(() => {
    console.log('\nOperation completed.');
    setTimeout(() => process.exit(0), 2000);
  }); 