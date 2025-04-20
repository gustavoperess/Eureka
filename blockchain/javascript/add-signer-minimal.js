// Minimal script to add the current wallet as a whitelisted signer with minimal gas
require('dotenv').config();
const { ethers } = require('ethers');
const CONTRACT_ADDRESS = '0x3C197333cFDa62bcd12FEdcEc43e0b6929110355';
const CONTRACT_ABI = require('./abi/contract-abi.json');

async function addSelfAsSigner() {
  console.log('🔑 Adding current wallet as a signer (minimal version)');
  console.log('=================================================\n');
  
  try {
    // Setup provider and wallet directly
    const provider = new ethers.providers.JsonRpcProvider('https://westend-asset-hub-eth-rpc.polkadot.io');
    const privateKey = process.env.PRIVATE_KEY.startsWith('0x') 
      ? process.env.PRIVATE_KEY 
      : `0x${process.env.PRIVATE_KEY}`;
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log(`Wallet address: ${wallet.address}`);
    const balance = await provider.getBalance(wallet.address);
    console.log(`Balance: ${ethers.utils.formatEther(balance)} ETH`);
    
    // Get the chain ID
    const network = await provider.getNetwork();
    console.log(`Connected to network: ${network.name}, chain ID: ${network.chainId}`);
    
    // Create contract instance with minimal ABI
    // We only need the addSigner function definition
    const minimalAbi = [
      "function addSigner(address signer) external",
      "function whitelist(address) external view returns (bool)"
    ];
    
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      minimalAbi,
      wallet
    );
    
    console.log(`\nAttempting to add ${wallet.address} as signer...`);
    
    // Set transaction parameters - use valid values
    const gasPrice = '1'; // 1 gwei
    const gasLimit = 50000;
    
    console.log(`Using gas price: ${gasPrice} gwei`);
    console.log(`Using gas limit: ${gasLimit}`);
    console.log(`Using legacy transaction type (type:0)`);
    
    // Check if already whitelisted first
    const currentStatus = await contract.whitelist(wallet.address);
    console.log(`Current whitelist status: ${currentStatus}`);
    
    if (currentStatus) {
      console.log('Address is already whitelisted! No need to continue.');
      return;
    }
    
    // Get the current nonce
    const nonce = await provider.getTransactionCount(wallet.address);
    console.log(`Using nonce: ${nonce}`);
    
    // Call the function with minimal params
    try {
      const tx = await contract.addSigner(wallet.address, {
        gasLimit: gasLimit,
        gasPrice: ethers.utils.parseUnits(gasPrice, 'gwei'),
        type: 0, // Force legacy transaction format
        nonce: nonce
      });
      
      console.log(`Transaction hash: ${tx.hash}`);
      console.log('Waiting for confirmation...');
      
      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed!');
      console.log(`Gas used: ${receipt.gasUsed.toString()}`);
      
      // Check if we're now whitelisted
      const isWhitelisted = await contract.whitelist(wallet.address);
      console.log(`\nWhitelist status: ${isWhitelisted ? 'SUCCESS ✅' : 'FAILED ❌'}`);
    } catch (txError) {
      console.error('Transaction failed:', txError.message);
      
      if (txError.message.includes('banned')) {
        console.log('\nTransaction is temporarily banned on this network.');
        console.log('This is a common issue with Polkadot\'s Ethereum compatibility layer.');
        console.log('Possible solutions:');
        console.log('1. Wait and try again later');
        console.log('2. Try with different gas parameters');
        console.log('3. Contact the network administrators');
      }
      
      // Check whitelist status again
      try {
        const isWhitelisted = await contract.whitelist(wallet.address);
        console.log(`Current whitelist status: ${isWhitelisted}`);
      } catch (readError) {
        console.error('Could not read whitelist:', readError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

// Run the script
addSelfAsSigner()
  .catch(console.error)
  .finally(() => {
    console.log('\nOperation completed.');
    setTimeout(() => process.exit(0), 2000);
  }); 