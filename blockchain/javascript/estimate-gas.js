require('dotenv').config();
const { ethers } = require('ethers');
const CONTRACT_ADDRESS = '0x19C8500bf08dDc7941801Fb629a4307C2bCdcD7E';

async function estimateGasRequirements() {
  console.log('🔍 Westend Asset Hub Gas Analysis');
  console.log('==============================\n');
  
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
    console.log(`Raw balance: ${balance.toString()} wei units`);
    
    // Get network details
    const network = await provider.getNetwork();
    console.log(`Network: ${network.name} (Chain ID: ${network.chainId})\n`);
    
    // Get the gas price
    const gasPrice = await provider.getGasPrice();
    console.log(`Current gas price: ${gasPrice.toString()} wei units`);
    console.log(`                 : ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);
    console.log(`                 : ${ethers.utils.formatEther(gasPrice)} WND\n`);
    
    // Define minimal ABI with just the functions we need
    const abi = [
      "function addSigner(address signer) external",
      "function whitelist(address) external view returns (bool)",
      "function owner() external view returns (address)"
    ];
    
    // Create contract instance
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);
    
    // Check if we're the owner
    const owner = await contract.owner();
    console.log(`Contract owner: ${owner}`);
    console.log(`Are you the owner? ${owner.toLowerCase() === wallet.address.toLowerCase() ? 'YES ✅' : 'NO ❌'}`);
    
    // Check current whitelist status
    const isWhitelisted = await contract.whitelist(wallet.address);
    console.log(`Already whitelisted? ${isWhitelisted ? 'YES ✅' : 'NO ❌'}\n`);
    
    // Analyze gas limit
    try {
      console.log('Estimating gas for addSigner transaction...');
      const gasEstimate = await contract.estimateGas.addSigner(wallet.address);
      console.log(`Estimated gas required: ${gasEstimate.toString()} units`);
      
      // Calculate cost
      const gasCost = gasEstimate.mul(gasPrice);
      console.log(`Estimated transaction cost: ${ethers.utils.formatEther(gasCost)} WND`);
      
      // Check if we have enough funds
      if (balance.lt(gasCost)) {
        console.log(`⚠️ WARNING: Insufficient funds for transaction!`);
        console.log(`  Required: ${ethers.utils.formatEther(gasCost)} WND`);
        console.log(`  Available: ${ethers.utils.formatEther(balance)} WND`);
        
        // Calculate how much more is needed
        const needed = gasCost.sub(balance);
        console.log(`  Need ${ethers.utils.formatEther(needed)} more WND\n`);
      } else {
        console.log(`✅ You have enough funds to perform this transaction\n`);
      }
    } catch (error) {
      console.log(`Could not estimate gas: ${error.message}\n`);
    }
    
    // Calculate maximum possible gas with current balance
    const maxGasLimit = balance.div(gasPrice);
    console.log(`Maximum gas limit with current balance: ~${maxGasLimit.toString()} units`);
    
    console.log('\nRecommended Transaction Parameters:');
    console.log(` - Gas price: ${gasPrice.toString()} wei`);
    console.log(` - Gas limit: 100000 units (safe value)`);
    console.log(` - Min balance needed: ${ethers.utils.formatEther(gasPrice.mul(100000))} WND`);
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
  
  console.log('\nOperation completed.');
}

// Run the script
estimateGasRequirements().catch(console.error); 