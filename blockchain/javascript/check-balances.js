require('dotenv').config();
const { ethers } = require('ethers');
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { formatBalance } = require('@polkadot/util');

async function checkAllBalances() {
  console.log('🔍 Checking Balances on Both Networks');
  console.log('====================================\n');
  
  try {
    // Get the private key
    const privateKey = process.env.PRIVATE_KEY.startsWith('0x') 
      ? process.env.PRIVATE_KEY 
      : `0x${process.env.PRIVATE_KEY}`;
    
    // Check Westend Asset Hub balance (ETH)
    const ethProvider = new ethers.providers.JsonRpcProvider('https://westend-asset-hub-eth-rpc.polkadot.io');
    const wallet = new ethers.Wallet(privateKey, ethProvider);
    const ethBalance = await ethProvider.getBalance(wallet.address);
    
    console.log('Wallet address:', wallet.address);
    console.log('\nWestend Asset Hub (EVM) Balance:');
    console.log(`ETH balance: ${ethers.utils.formatEther(ethBalance)} ETH`);
    
    // Check Westend native balance (WND)
    console.log('\nWestend Native Balance:');
    const provider = new WsProvider('wss://westend-rpc.polkadot.io');
    const api = await ApiPromise.create({ provider });
    
    try {
      // Try to get the WND balance
      const { data: balance } = await api.query.system.account(wallet.address);
      console.log('WND balance:', formatBalance(balance.free, { withSi: true, decimals: 12 }));
    } catch (error) {
      console.log('Could not fetch WND balance directly for EVM address.');
      console.log('This is normal as the addresses are different between chains.');
    }
    
    console.log('\nYou need ETH on the Westend Asset Hub to interact with the contract.');
    console.log('To get ETH, you need to bridge your WND tokens from Westend to the Asset Hub.');
    console.log('\nHow to bridge your tokens:');
    console.log('1. Go to https://polkadot.js.org/apps/?rpc=wss://westend-rpc.polkadot.io');
    console.log('2. Navigate to Accounts > Transfer');
    console.log('3. Select your Westend account with WND tokens');
    console.log('4. In the "destination chain" dropdown, select "Westend Asset Hub"');
    console.log('5. Enter your EVM address as the destination');
    console.log('6. Complete the transfer');
    
    await api.disconnect();
  } catch (error) {
    console.error('Error checking balances:', error);
  }
  
  console.log('\nOperation completed.');
}

// Run the script
checkAllBalances().catch(console.error); 