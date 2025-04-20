require('dotenv').config();
const { ethers } = require('ethers');
const CONTRACT_ADDRESS = '0x3C197333cFDa62bcd12FEdcEc43e0b6929110355';
const CONTRACT_ABI = require('./abi/contract-abi.json');

async function submitInvoice() {
  console.log('📄 Submit Invoice (Direct Raw Transaction)');
  console.log('======================================\n');
  
  try {
    // Setup provider and wallet
    const provider = new ethers.providers.JsonRpcProvider('https://westend-asset-hub-eth-rpc.polkadot.io');
    const privateKey = process.env.PRIVATE_KEY.startsWith('0x') 
      ? process.env.PRIVATE_KEY 
      : `0x${process.env.PRIVATE_KEY}`;
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log(`Address: ${wallet.address}`);
    const balance = await provider.getBalance(wallet.address);
    console.log(`Balance: ${ethers.utils.formatEther(balance)} WND`);
    
    // Get network info
    const network = await provider.getNetwork();
    console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Verify that we're on Westend Asset Hub with WND
    console.log('\n--- Network Verification ---');
    console.log('Provider URL: https://westend-asset-hub-eth-rpc.polkadot.io');
    console.log('This is Westend Asset Hub which uses WND tokens');
    console.log('Though ethers.js displays it as ETH, it is actually WND');
    
    // Connect to the contract
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI.abi, wallet);
    
    // Check if we're whitelisted
    const isWhitelisted = await contract.whitelist(wallet.address);
    console.log(`Whitelisted: ${isWhitelisted ? 'YES ✅' : 'NO ❌'}`);
    
    if (!isWhitelisted) {
      console.log('You must be whitelisted to submit an invoice');
      return;
    }
    
    // Generate random invoice data
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const invoiceId = `INV-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    
    // Show the data we're submitting
    console.log(`\nSubmitting with:`);
    console.log(`Invoice ID: ${invoiceId}`);
    console.log(`Hash: ${hash}`);
    
    // Call the submitInvoice function with minimal gas parameters
    console.log('\nSending transaction with minimal gas parameters...');
    
    // Get maximum gas limit from our balance (most conservative approach)
    const gasPrice = 1000; // 1000 wei as per estimation
    const maxGasFromBalance = balance.div(gasPrice).mul(9).div(10); // 90% of max
    const gasLimit = 50000; // Use a very low limit
    
    console.log(`Using gas price: ${gasPrice} wei`);
    console.log(`Using gas limit: ${gasLimit} (maximum from balance: ${maxGasFromBalance.toString()})`);
    
    // Use low-level gas settings, just enough to cover costs
    try {
      const tx = await contract.submitInvoice(
        hash, 
        invoiceId,
        {
          gasPrice: gasPrice,
          gasLimit: gasLimit,
          type: 0 // Try legacy transaction
        }
      );
      
      console.log(`Transaction hash: ${tx.hash}`);
      console.log('Waiting for confirmation...');
      
      // Wait for receipt
      const receipt = await tx.wait();
      console.log(`\nTransaction confirmed in block ${receipt.blockNumber}`);
      console.log(`Status: ${receipt.status === 1 ? 'SUCCESS ✅' : 'FAILED ❌'}`);
      
      // Check the result
      const exists = await contract.shaExists(hash);
      console.log(`\nInvoice added: ${exists ? 'YES ✅' : 'NO ❌'}`);
      
      if (exists) {
        // Get invoice details
        const invoice = await contract.getInvoice(invoiceId);
        console.log('\nInvoice details:');
        console.log(` - Hash: ${invoice[0]}`);
        console.log(` - ID: ${invoice[1]}`);
        console.log(` - Submitter: ${invoice[2]}`);
        console.log(` - Timestamp: ${invoice[3].toString()}`);
        console.log(` - Verified: ${invoice[4]}`);
        console.log(` - Processed: ${invoice[5]}`);
      }
    } catch (error) {
      console.error(`\nTransaction error: ${error.message}`);
      
      if (error.error) {
        console.log('\nDetailed error:');
        console.log(` - Code: ${error.error.code}`);
        console.log(` - Data: ${error.error.data}`);
      }
    }
    
  } catch (error) {
    console.error(`\nError: ${error.message}`);
  }
  
  console.log('\nOperation completed.');
}

// Run the script
submitInvoice().catch(console.error); 