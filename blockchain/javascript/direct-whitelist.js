require('dotenv').config();
const { ethers } = require('ethers');

async function directWhitelist() {
  console.log('Direct Whitelisting Attempt');
  console.log('==========================\n');
  
  try {
    const provider = new ethers.providers.JsonRpcProvider('https://westend-asset-hub-eth-rpc.polkadot.io');
    const privateKey = process.env.PRIVATE_KEY.startsWith('0x') 
      ? process.env.PRIVATE_KEY 
      : `0x${process.env.PRIVATE_KEY}`;
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log(`Address: ${wallet.address}`);
    
    // Create minimal contract interface with just the function we need
    const contractInterface = new ethers.utils.Interface([
      "function addSigner(address signer) external",
      "function whitelist(address) external view returns (bool)"
    ]);
    
    // Check if already whitelisted
    const readContract = new ethers.Contract(
      '0x19C8500bf08dDc7941801Fb629a4307C2bCdcD7E',
      contractInterface,
      provider
    );
    const isWhitelisted = await readContract.whitelist(wallet.address);
    console.log(`Already whitelisted? ${isWhitelisted ? 'YES ✅' : 'NO ❌'}`);
    
    if (isWhitelisted) {
      console.log('No need to whitelist - already done!');
      return;
    }
    
    // Encode the function call
    const data = contractInterface.encodeFunctionData("addSigner", [wallet.address]);
    
    // Create the raw transaction
    const nonce = await provider.getTransactionCount(wallet.address);
    const tx = {
      to: '0x19C8500bf08dDc7941801Fb629a4307C2bCdcD7E',
      data: data,
      nonce: nonce,
      gasPrice: 800, // Reduced from estimation
      gasLimit: 60000, // Reduced from recommendation
      chainId: 420420421,
      value: 0
    };
    
    console.log('Sending transaction with:');
    console.log(` - Gas price: ${tx.gasPrice} wei`);
    console.log(` - Gas limit: ${tx.gasLimit}`);
    console.log(` - Nonce: ${tx.nonce}`);
    
    // Sign and send the transaction
    const signedTx = await wallet.signTransaction(tx);
    console.log('Transaction signed, sending...');
    
    const txResponse = await provider.sendTransaction(signedTx);
    console.log(`Transaction sent: ${txResponse.hash}`);
    
    // Wait for confirmation
    const receipt = await txResponse.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`Status: ${receipt.status === 1 ? 'SUCCESS ✅' : 'FAILED ❌'}`);
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    
    // Log more details about the error
    if (error.code) {
      console.log(`Error code: ${error.code}`);
    }
    
    if (error.data) {
      console.log(`Error data: ${error.data}`);
    }
    
    if (error.message.includes('gas')) {
      console.log(`\nThis appears to be a gas-related issue. The estimation gave us a value of 16514273291734 units.`);
      console.log(`Try a different approach with a much smaller gas limit like 100000.`);
    } else if (error.message.includes('insufficient funds')) {
      console.log(`\nThis appears to be a balance issue. Check if you have enough WND.`);
    } else if (error.message.includes('balance too low') || error.message.includes('fees')) {
      console.log(`\nThis appears to be a balance/fee calculation issue which is common on Westend Asset Hub.`);
      console.log(`Try with a smaller gas limit or different gas price.`);
    }
  }
}

directWhitelist().catch(console.error); 