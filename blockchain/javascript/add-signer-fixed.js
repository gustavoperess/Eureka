// Script to add the current wallet as a whitelisted signer with a fixed gas limit
require('dotenv').config();
const { ethers } = require('ethers');
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
    console.log(`Connected to chain: ${connectionInfo.chain}`);
    console.log(`Balance: ${connectionInfo.account.balance} ETH`);
    
    // Create provider and connect wallet
    const provider = new ethers.providers.JsonRpcProvider('https://westend-asset-hub-eth-rpc.polkadot.io');
    const privateKey = process.env.PRIVATE_KEY.startsWith('0x') 
      ? process.env.PRIVATE_KEY 
      : `0x${process.env.PRIVATE_KEY}`;
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Get the contract ABI and create a contract instance with the wallet
    const contract = require('./abi/contract-abi.json');
    const writeContract = new ethers.Contract(
      connectionInfo.contractAddress,
      contract.abi,
      wallet
    );
    
    console.log('\nAttempting to add self as signer...');
    
    // Call the addSigner function with fixed gas parameters
    const tx = await writeContract.addSigner(myAddress, {
      gasLimit: 300000, // Use a reasonable fixed gas limit
      gasPrice: ethers.utils.parseUnits('1', 'gwei') // 1 gwei
    });
    
    console.log(`Transaction sent: ${tx.hash}`);
    console.log('Waiting for confirmation...');
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    
    console.log('✅ Successfully added self as signer!');
    console.log(`Transaction hash: ${receipt.transactionHash}`);
    console.log(`Block number: ${receipt.blockNumber}`);
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);
    
    // Verify the result
    const isWhitelisted = await writeContract.whitelist(myAddress);
    console.log(`\nVerifying whitelist status: ${isWhitelisted ? 'SUCCESS ✅' : 'FAILED ❌'}`);
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    
    if (error.message.includes('gas required exceeds')) {
      console.log('\nTry lowering the gas limit in the script.');
    } else if (error.message.includes('nonce')) {
      console.log('\nPossible nonce issue. Try resetting the nonce or waiting a few minutes.');
    }
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