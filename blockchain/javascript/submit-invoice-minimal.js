require('dotenv').config();
const { ethers } = require('ethers');
const CONTRACT_ADDRESS = '0x19C8500bf08dDc7941801Fb629a4307C2bCdcD7E';

async function submitInvoiceMinimal() {
  console.log('📝 Submit Invoice (Using Proper Gas Estimation)');
  console.log('==========================================\n');
  
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
    
    // Create a contract instance for both reading and writing
    const contractInterface = new ethers.utils.Interface([
      "function submitInvoice(bytes32 sha256Hash, string memory invoiceId) external",
      "function shaExists(bytes32 sha256Hash) external view returns (bool)"
    ]);
    
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractInterface, wallet);
    
    // Generate random invoice data
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const invoiceId = `INV-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    
    console.log(`\nSubmitting invoice:`);
    console.log(`ID: ${invoiceId}`);
    console.log(`Hash: ${hash}`);
    
    // Get proper fee data from the network
    console.log('\nQuerying current network fee data...');
    const feeData = await provider.getFeeData();
    console.log(`Max fee per gas: ${ethers.utils.formatUnits(feeData.maxFeePerGas || 0, 'gwei')} gwei`);
    console.log(`Max priority fee: ${ethers.utils.formatUnits(feeData.maxPriorityFeePerGas || 0, 'gwei')} gwei`);
    console.log(`Gas price: ${ethers.utils.formatUnits(feeData.gasPrice || 0, 'gwei')} gwei`);
    
    // Actually estimate the gas for our specific transaction
    console.log('\nEstimating gas for this transaction...');
    let estimatedGas;
    try {
      estimatedGas = await contract.estimateGas.submitInvoice(hash, invoiceId);
      console.log(`Estimated gas: ${estimatedGas.toString()} units`);
    } catch (estError) {
      console.log(`Gas estimation failed: ${estError.message}`);
      console.log('Using conservative gas limit of 100,000 units');
      estimatedGas = ethers.BigNumber.from(100000);
    }
    
    // Add a 20% buffer to the gas estimate
    const gasLimit = estimatedGas.mul(120).div(100); 
    console.log(`Gas limit with buffer: ${gasLimit.toString()} units`);
    
    // For Westend, use type 2 transactions with proper fee data
    // If getFeeData returns null values, use safe defaults
    const tx = {
      type: 2, // Use EIP-1559 transaction type
      maxFeePerGas: feeData.maxFeePerGas || ethers.utils.parseUnits('10', 'gwei'),
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || ethers.utils.parseUnits('1', 'gwei'),
      gasLimit: gasLimit
    };
    
    console.log('\nTransaction parameters:');
    console.log(` - Max fee per gas: ${ethers.utils.formatUnits(tx.maxFeePerGas, 'gwei')} gwei`);
    console.log(` - Max priority fee: ${ethers.utils.formatUnits(tx.maxPriorityFeePerGas, 'gwei')} gwei`);
    console.log(` - Gas limit: ${tx.gasLimit.toString()} units`);
    
    // Send the transaction
    console.log('\nSending transaction...');
    const txResponse = await contract.submitInvoice(hash, invoiceId, tx);
    
    console.log(`Transaction sent: ${txResponse.hash}`);
    console.log('Waiting for confirmation...');
    
    // Wait for the transaction to be mined
    const receipt = await txResponse.wait();
    console.log(`\nTransaction confirmed in block ${receipt.blockNumber}`);
    console.log(`Status: ${receipt.status === 1 ? 'SUCCESS ✅' : 'FAILED ❌'}`);
    console.log(`Gas used: ${receipt.gasUsed.toString()} units`);
    
    // Verify the invoice was added
    const exists = await contract.shaExists(hash);
    console.log(`\nInvoice hash exists: ${exists ? 'YES ✅' : 'NO ❌'}`);
    
  } catch (error) {
    console.error(`\nError: ${error.message}`);
    
    if (error.error) {
      console.log(`\nDetailed error:`);
      console.log(` - Code: ${error.error.code}`);
      console.log(` - Data: ${error.error.data}`);
    }
    
    console.log('\nRecommendations:');
    console.log('1. Check your WND balance is sufficient for the transaction');
    console.log('2. For Westend Asset Hub, connect to the network support community');
    console.log('3. Confirm your contract functions correctly on this network');
  }
  
  console.log('\nOperation completed.');
}

// Run the script
submitInvoiceMinimal().catch(console.error); 