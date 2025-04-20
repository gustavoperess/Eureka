// Script to add signer using a more direct approach
require('dotenv').config();
const { ethers } = require('ethers');
const CONTRACT_ADDRESS = '0x3C197333cFDa62bcd12FEdcEc43e0b6929110355';

// Function selector for addSigner(address)
const ADD_SIGNER_SELECTOR = 'eb12d61e';

async function addSignerDirect() {
  console.log('🔑 Adding signer using direct transaction approach');
  console.log('==============================================\n');
  
  try {
    // Setup provider and wallet
    const provider = new ethers.providers.JsonRpcProvider('https://westend-asset-hub-eth-rpc.polkadot.io');
    const privateKey = process.env.PRIVATE_KEY.startsWith('0x') 
      ? process.env.PRIVATE_KEY 
      : `0x${process.env.PRIVATE_KEY}`;
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log(`Wallet address: ${wallet.address}`);
    const balance = await provider.getBalance(wallet.address);
    console.log(`Balance: ${ethers.utils.formatEther(balance)} WND`);
    
    // Get the current nonce
    const nonce = await provider.getTransactionCount(wallet.address);
    console.log(`Current nonce: ${nonce}`);
    
    // Prepare calldata - addSigner(address) with your address
    // Format: function selector + address parameter
    // First, encode the address parameter properly
    const abiCoder = new ethers.utils.AbiCoder();
    const encodedAddress = abiCoder.encode(['address'], [wallet.address]);
    
    // Create complete calldata: selector + encoded parameter (removing 0x from encoded parameter)
    const calldata = ADD_SIGNER_SELECTOR + encodedAddress.slice(2);
    console.log(`Call data: 0x${calldata}`);
    
    // Create transaction
    const tx = {
      to: CONTRACT_ADDRESS,
      data: '0x' + calldata,
      gasLimit: 200000,
      gasPrice: 100000000, // 100M units - appropriate for WND
      nonce: nonce,
      chainId: 420420421,
      type: 0 // Legacy transaction
    };
    
    console.log('Transaction prepared:');
    console.log(` - To: ${tx.to}`);
    console.log(` - Gas limit: ${tx.gasLimit.toString()}`);
    console.log(` - Gas price: ${tx.gasPrice} units`);
    console.log(` - Nonce: ${tx.nonce}`);
    console.log(` - Chain ID: ${tx.chainId}`);
    console.log(` - Type: Legacy (0)`);
    
    console.log('\nSending transaction...');
    const response = await wallet.sendTransaction(tx);
    console.log(`Transaction sent: ${response.hash}`);
    console.log('Waiting for confirmation...');
    
    const receipt = await response.wait();
    console.log('✅ Transaction confirmed!');
    console.log(` - Block: ${receipt.blockNumber}`);
    console.log(` - Gas used: ${receipt.gasUsed.toString()}`);
    
    // Verify we're now whitelisted
    // Define minimal ABI with just the whitelist function
    const abi = ["function whitelist(address) external view returns (bool)"];
    const readContract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
    const isWhitelisted = await readContract.whitelist(wallet.address);
    console.log(`\nWhitelist status: ${isWhitelisted ? 'SUCCESS ✅' : 'FAILED ❌'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('gas')) {
      console.log('\nThis is likely a gas estimation issue. Try with a higher gas limit or gas price.');
    } else if (error.message.includes('nonce')) {
      console.log('\nThis is likely a nonce issue. Try with a different nonce.');
    } else if (error.message.includes('fees') || error.message.includes('balance')) {
      console.log('\nInsufficient funds to cover gas fees. Check your balance of WND tokens.');
    } else if (error.message.includes('banned')) {
      console.log('\nTransaction temporarily banned. This is common on Westend test networks.');
      console.log('Try again with different parameters or wait a while.');
    }
  }
}

// Run the script
addSignerDirect()
  .catch(console.error)
  .finally(() => {
    console.log('\nOperation completed.');
    setTimeout(() => process.exit(0), 2000);
  }); 