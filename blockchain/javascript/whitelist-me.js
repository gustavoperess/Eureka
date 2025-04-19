// Simple script to whitelist the current wallet
require('dotenv').config();
const { ethers } = require('ethers');
const CONTRACT_ADDRESS = '0x19C8500bf08dDc7941801Fb629a4307C2bCdcD7E';

async function whitelistMe() {
  console.log('🔑 Simple Whitelisting Script');
  console.log('===========================\n');
  
  try {
    // Setup provider and wallet
    const provider = new ethers.providers.JsonRpcProvider('https://westend-asset-hub-eth-rpc.polkadot.io');
    
    // Make sure we have the private key
    if (!process.env.PRIVATE_KEY) {
      throw new Error("PRIVATE_KEY is missing from .env file");
    }
    
    // Format the private key correctly
    const privateKey = process.env.PRIVATE_KEY.startsWith('0x') 
      ? process.env.PRIVATE_KEY 
      : `0x${process.env.PRIVATE_KEY}`;
    
    // Create wallet with the private key
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`Wallet address: ${wallet.address}`);
    
    // Get network info
    const network = await provider.getNetwork();
    console.log(`Network: Chain ID ${network.chainId}`);
    
    // Get balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`Balance: ${ethers.utils.formatEther(balance)} WND`);
    
    // Define minimal ABI with just the functions we need
    const abi = [
      "function addSigner(address signer) external",
      "function owner() external view returns (address)",
      "function whitelist(address) external view returns (bool)"
    ];
    
    // Create contract instance
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);
    
    // Check if we're the owner
    const owner = await contract.owner();
    console.log(`Contract owner: ${owner}`);
    console.log(`Are you the owner? ${owner.toLowerCase() === wallet.address.toLowerCase() ? 'YES ✅' : 'NO ❌'}`);
    
    // Check if already whitelisted 
    const isWhitelisted = await contract.whitelist(wallet.address);
    console.log(`Already whitelisted? ${isWhitelisted ? 'YES ✅' : 'NO ❌'}`);
    
    if (isWhitelisted) {
      console.log('\nYour address is already whitelisted! No action needed.');
      return;
    }
    
    // Get current nonce
    const nonce = await provider.getTransactionCount(wallet.address);
    console.log(`Current nonce: ${nonce}`);
    
    console.log('\nSending transaction with options:');
    const txOptions = {
      gasLimit: 300000, // More reasonable value
      gasPrice: 1000, // 1000 wei as shown by estimation
      nonce: nonce,
      type: 0 // Legacy transaction
    };
    console.log(txOptions);
    
    // Try to add self as signer with minimal gas settings
    const tx = await contract.addSigner(wallet.address, txOptions);
    
    console.log(`\nTransaction sent! Hash: ${tx.hash}`);
    console.log('Waiting for confirmation...');
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);
    
    // Verify we're now whitelisted
    const nowWhitelisted = await contract.whitelist(wallet.address);
    console.log(`\nWhitelist status now: ${nowWhitelisted ? 'SUCCESS ✅' : 'STILL FAILED ❌'}`);
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    
    if (error.message.includes('banned')) {
      console.log('\nTransaction is temporarily banned on this network.');
      console.log('Try again with different gas settings or wait a while.');
    } else if (error.message.includes('gas')) {
      console.log('\nGas-related error. Try with even lower gas values.');
    }
  }
  
  console.log('\nOperation completed.');
}

// Run the script
whitelistMe().catch(console.error); 