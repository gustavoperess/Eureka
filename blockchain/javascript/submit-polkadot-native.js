require('dotenv').config();
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { cryptoWaitReady } = require('@polkadot/util-crypto');
const { hexToU8a } = require('@polkadot/util');

// Contract address and ABI
const CONTRACT_ADDRESS = '0x19C8500bf08dDc7941801Fb629a4307C2bCdcD7E';

async function submitInvoiceNative() {
  console.log('📝 Submit Invoice using Native Polkadot API');
  console.log('=========================================\n');
  
  try {
    // Initialize polkadot API with direct WebSocket connection
    console.log('Connecting to Westend Asset Hub...');
    const wsProvider = new WsProvider('wss://westend-asset-hub-rpc.polkadot.io');
    const api = await ApiPromise.create({ provider: wsProvider });
    
    // Wait for crypto to be ready
    await cryptoWaitReady();
    
    // Display chain information
    const chain = await api.rpc.system.chain();
    console.log(`Connected to ${chain}`);
    
    // Setup account with ethereum compatibility
    const keyring = new Keyring({ type: 'ethereum' });
    const privateKey = process.env.PRIVATE_KEY.startsWith('0x') 
      ? process.env.PRIVATE_KEY.substring(2)
      : process.env.PRIVATE_KEY;
      
    // Add the account
    const account = keyring.addFromSeed(hexToU8a('0x' + privateKey));
    console.log(`Account address: ${account.address}`);
    
    // Check account balance
    const { data: balance } = await api.query.system.account(account.address);
    console.log(`Balance: ${balance.free.toString()} units`);
    
    // Generate random invoice data
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const invoiceId = `INV-POL-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    
    console.log(`\nPreparing to submit invoice:`);
    console.log(`ID: ${invoiceId}`);
    console.log(`Hash: ${hash}`);
    
    // Call EVM with native Polkadot extrinsic
    console.log('\nSending transaction using native Polkadot extrinsic...');
    
    // Construct the ABI call data for submitInvoice(bytes32,string)
    // This part will depend on the exact function signature and parameters
    const abiEncoded = `0x616794d3${hash.slice(2).padStart(64, '0')}000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000${Buffer.from(invoiceId).toString('hex').padEnd(64, '0')}`;
    
    // Create the extrinsic
    const tx = api.tx.evm.call(
      account.address,  // from address
      CONTRACT_ADDRESS, // to address
      abiEncoded,       // data
      0,                // value
      1000000,          // gas limit
      1000,             // max fee per gas
      null,             // max priority fee per gas
      null,             // nonce
      []                // access list
    );
    
    // Sign and send the transaction
    const unsub = await tx.signAndSend(account, { nonce: -1 }, (result) => {
      console.log(`Transaction status: ${result.status.type}`);
      
      if (result.status.isInBlock) {
        console.log(`Transaction included in block: ${result.status.asInBlock.toHex()}`);
      } else if (result.status.isFinalized) {
        console.log(`Transaction finalized in block: ${result.status.asFinalized.toHex()}`);
        
        // Check for events
        if (result.events) {
          result.events.forEach(({ phase, event: { data, method, section } }) => {
            console.log(`Event: ${section}.${method} ${data.toString()}`);
          });
        }
        
        unsub();
      }
    });
    
    // Wait for transaction to complete
    console.log('\nWaiting for transaction to be finalized...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Disconnect from the API
    await api.disconnect();
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
  
  console.log('\nOperation completed.');
}

// Run the script
submitInvoiceNative().catch(console.error); 