// Script to check who owns the contract and if the current wallet has rights
require('dotenv').config();
const { ethers } = require('ethers');
const contractService = require('./services/contractService');

async function checkOwnerAndPermissions() {
  console.log('🔍 Checking Contract Ownership and Permissions');
  console.log('============================================\n');
  
  try {
    // Get current wallet address
    const connectionInfo = await contractService.getConnectionInfo();
    const myAddress = connectionInfo.account.address;
    
    console.log(`Current wallet address: ${myAddress}`);
    console.log(`Contract address: ${connectionInfo.contractAddress}`);
    console.log(`Connected to chain: ${connectionInfo.chain}`);
    console.log(`Balance: ${connectionInfo.account.balance} ETH`);
    
    // Create a basic read-only provider
    const provider = new ethers.providers.JsonRpcProvider('https://westend-asset-hub-eth-rpc.polkadot.io');
    
    // Get the contract ABI from the contractService module
    const contract = require('./abi/contract-abi.json');
    
    // Connect to the contract, read-only
    const readContract = new ethers.Contract(
      connectionInfo.contractAddress,
      contract.abi,
      provider
    );
    
    // Try to check the owner using the contract's owner() function
    try {
      console.log('\nAttempting to check contract owner...');
      const owner = await readContract.owner();
      console.log(`✅ Contract owner: ${owner}`);
      console.log(`Are you the owner? ${owner.toLowerCase() === myAddress.toLowerCase() ? 'YES ✅' : 'NO ❌'}`);
    } catch (error) {
      console.error('❌ Could not check contract owner:', error.message);
    }
    
    // Try to check if the current address is whitelisted
    try {
      console.log('\nChecking if your address is whitelisted...');
      const isWhitelisted = await readContract.whitelist(myAddress);
      console.log(`✅ Is whitelisted: ${isWhitelisted ? 'YES ✅' : 'NO ❌'}`);
    } catch (error) {
      console.error('❌ Could not check whitelist status:', error.message);
    }
    
    console.log('\nNext Steps:');
    console.log('1. If you are the contract owner, make sure your private key is correct');
    console.log('2. Use the addSigner function through a transaction with a REASONABLE gas estimate');
    console.log('3. Or deploy a simpler test contract where you know you are the owner');
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

// Execute the function
checkOwnerAndPermissions()
  .catch(error => {
    console.error('Unhandled error:', error);
  })
  .finally(() => {
    console.log('\nOperation completed.');
    // Keep process alive briefly to complete any pending operations
    setTimeout(() => process.exit(0), 1000);
  }); 