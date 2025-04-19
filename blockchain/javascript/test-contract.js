// Test script for validating contract connectivity
require('dotenv').config();
const contractService = require('./services/contractService');
const { ethers } = require('ethers');
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { formatBalance } = require('@polkadot/util');

// Function to check Westend native WND balance
async function checkWestendNativeBalance() {
  try {
    console.log('WND Balance Check:');
    
    // Use a direct Westend RPC endpoint
    const provider = new WsProvider('wss://westend-rpc.polkadot.io');
    const api = await ApiPromise.create({ provider });
    
    // Get EVM address from contractService
    const connectionInfo = await contractService.getConnectionInfo();
    const evmAddress = connectionInfo.account.address;
    
    // Try to get the WND balance for the EVM address (if mapped)
    const { data: balance } = await api.query.system.account(evmAddress);
    
    console.log('  Native WND tokens:', formatBalance(balance.free, { withSi: true, decimals: 12 }));
    await api.disconnect();
    return balance.free;
  } catch (error) {
    console.log('  Could not check WND balance:', error.message);
    return null;
  }
}

// Utility to generate a valid invoice hashcode
function generateInvoiceHashcode() {
  // Format: INV-XXXX-XXXX per contract requirements
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'INV-';
  
  // Generate first 4 characters
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  code += '-';
  
  // Generate last 4 characters
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

async function testContract() {
  console.log('🧪 Polkadot Contract Test');
  console.log('========================\n');
  
  try {
    // Check Westend native WND balance first
    const wndBalance = await checkWestendNativeBalance();
    
    // Check account balance for EVM
    const accountInfo = await contractService.getConnectionInfo();
    console.log('EVM Balance Check:');
    console.log(`  Address: ${accountInfo.account.address}`);
    console.log(`  Balance: ${accountInfo.account.balance} ETH`);
    
    const balanceInEth = parseFloat(accountInfo.account.balance);
    if (balanceInEth <= 0) {
      console.log('\n⚠️  No EVM balance - transactions will fail');
      console.log('   Need to bridge WND tokens to Asset Hub EVM');
    } else if (balanceInEth < 0.01) {
      console.log('\n⚠️  Low EVM balance - may not cover all transaction fees');
    } else {
      console.log('  ✅ Sufficient balance for testing');
    }
    
    // Validate contract connection
    console.log('\nContract Validation:');
    const validation = await contractService.validateContract();
    
    if (!validation.valid) {
      console.error('  ❌ Contract validation failed:', validation.error);
      return;
    }
    
    console.log('  ✅ Connected to contract at', validation.contractAddress);
    
    // Test a random hash query
    const testHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    const exists = await contractService.shaExists(testHash);
    console.log('  ✅ shaExists query successful:', exists ? 'Yes' : 'No (expected for random hash)');
    
    // Submit a new invoice
    console.log('\n📝 Testing Invoice Submission:');
    const invoiceHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    const invoiceHashcode = generateInvoiceHashcode();
    console.log('  Hash:', invoiceHash);
    console.log('  Hashcode:', invoiceHashcode);
    
    try {
      console.log('  Submitting to blockchain...');
      const submitResult = await contractService.submitInvoice(invoiceHash, invoiceHashcode);
      console.log('  ✅ Invoice submitted successfully!');
      console.log('     TX:', submitResult.transactionHash.substring(0, 10) + '...');
      
      // Wait for the transaction to be fully confirmed
      console.log('  Waiting for confirmation...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Verify the invoice exists
      console.log('\n🔍 Verifying Invoice:');
      
      // Check if hash exists
      const hashExists = await contractService.shaExists(invoiceHash);
      console.log('  Hash exists:', hashExists ? '✅ Yes' : '❌ No');
      
      // Retrieve and show invoice data
      const invoiceData = await contractService.getInvoice(invoiceHashcode);
      console.log('  Data retrieved:', 
        invoiceData.hashcode ? '✅ Yes' : '❌ No',
        invoiceData.status ? `(${invoiceData.status})` : '');
      
      // Complete the invoice
      console.log('\n✅ Testing Invoice Completion:');
      console.log('  Marking as completed...');
      const completeResult = await contractService.completeInvoice(invoiceHashcode);
      console.log('  ✅ Invoice marked as completed!');
      console.log('     TX:', completeResult.transactionHash.substring(0, 10) + '...');
      
      // Wait for confirmation
      console.log('  Waiting for confirmation...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Verify completed status
      const updatedInvoice = await contractService.getInvoice(invoiceHashcode);
      console.log('  Updated status:', updatedInvoice.status);
      
    } catch (submitError) {
      console.error('  ❌ Error:', submitError.message);
      if (submitError.message.includes('already exists')) {
        console.log('     Invoice hashcode already exists, try again with a different one');
      } else if (submitError.message.includes('Insufficient balance')) {
        console.log('     You need to fund your EVM account first');
      } else if (submitError.message.includes('NotAuthorised')) {
        console.log('\n🔑 AUTHORIZATION REQUIRED');
        console.log('     Your account is not whitelisted as a signer in the contract');
        console.log('     The contract owner needs to call: addSigner("' + accountInfo.account.address + '")');
        console.log('     See EurekaInvoiceRegistryV2.sol for details');
      }
    }
    
    console.log('\n✨ Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Execute the test
testContract()
  .catch(error => {
    console.error('Unhandled error:', error);
  })
  .finally(() => {
    console.log('\nTest completed.');
    // Keep process alive briefly to complete any pending operations
    setTimeout(() => process.exit(0), 1000);
  }); 