// Script to add the current wallet as a whitelisted signer on the contract
require('dotenv').config();
const contractService = require('./services/contractService');

async function addSelfAsSigner() {
  console.log('🔑 Adding current wallet as a whitelisted signer');
  console.log('================================================\n');
  
  try {
    // Get current wallet address
    const connectionInfo = await contractService.getConnectionInfo();
    const myAddress = connectionInfo.account.address;
    
    console.log(`Current wallet address: ${myAddress}`);
    console.log(`Contract address: ${connectionInfo.contractAddress}`);
    
    // Check if we're connected to the right network
    console.log(`Connected to chain: ${connectionInfo.chain}`);
    console.log(`Balance: ${connectionInfo.account.balance} ETH`);
    
    console.log('\nAttempting to add self as signer...');
    
    // If you're the contract owner, you should be able to add yourself as a signer
    try {
      const result = await contractService.addSigner(myAddress);
      console.log('✅ Successfully added self as signer!');
      console.log(`Transaction hash: ${result.transactionHash}`);
      console.log(`Block number: ${result.blockNumber}`);
      console.log(`Gas used: ${result.gasUsed}`);
    } catch (error) {
      console.error('❌ Failed to add signer:', error.message);
      
      if (error.message.includes('NotAuthorised') || error.message.includes('onlyOwner')) {
        console.log('\nThis error suggests your account is not the contract owner.');
        console.log('Only the contract owner can add signers to the whitelist.');
        console.log('Please check:');
        console.log('1. You are using the same private key that deployed the contract');
        console.log('2. The contract address is correct');
        console.log('3. You are connected to the correct network');
      }
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

// Execute the function
addSelfAsSigner()
  .catch(error => {
    console.error('Unhandled error:', error);
  })
  .finally(() => {
    console.log('\nOperation completed.');
    // Keep process alive briefly to complete any pending operations
    setTimeout(() => process.exit(0), 1000);
  }); 