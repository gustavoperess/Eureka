require('dotenv').config();
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { ContractPromise } = require('@polkadot/api-contract');
const { Keyring } = require('@polkadot/keyring');
const { cryptoWaitReady } = require('@polkadot/util-crypto');
const { hexToU8a } = require('@polkadot/util');

// Contract address and ABI
const CONTRACT_ADDRESS = '0x19C8500bf08dDc7941801Fb629a4307C2bCdcD7E';
const CONTRACT_ABI = require('./abi/contract-abi.json');

async function interactWithContract() {
  console.log('🔄 Using Polkadot.js to interact with contract');
  console.log('===========================================\n');
  
  try {
    // Wait for the crypto libraries to be ready
    await cryptoWaitReady();
    console.log('Crypto libraries initialized');
    
    // Connect to Westend Asset Hub
    const wsProvider = new WsProvider('wss://westend-asset-hub-rpc.polkadot.io');
    const api = await ApiPromise.create({ provider: wsProvider });
    const chainInfo = await api.registry.getChainProperties();
    console.log(`Connected to ${(await api.rpc.system.chain()).toString()}`);
    
    // Setup keyring for signing transactions
    const keyring = new Keyring({ type: 'ethereum' });
    const privateKey = process.env.PRIVATE_KEY.startsWith('0x') 
      ? process.env.PRIVATE_KEY.substring(2) // Remove 0x prefix
      : process.env.PRIVATE_KEY;
    
    // Add the account using private key
    const account = keyring.addFromSeed(hexToU8a(`0x${privateKey}`));
    console.log(`Account address: ${account.address}`);
    
    // Get the account balance
    const { data: balance } = await api.query.system.account(account.address);
    console.log(`Balance: ${balance.free.toString()} units`);
    
    // Create a contract instance
    const contract = new ContractPromise(api, CONTRACT_ABI, CONTRACT_ADDRESS);
    console.log(`Contract at: ${CONTRACT_ADDRESS}`);
    
    // Check whitelist status first
    const { result, output } = await contract.query.whitelist(
      account.address,
      { gasLimit: -1 },
      account.address
    );
    
    const isWhitelisted = output.toJSON();
    console.log(`Already whitelisted? ${isWhitelisted ? 'YES ✅' : 'NO ❌'}`);
    
    if (isWhitelisted) {
      console.log('No need to whitelist - already done!');
      await api.disconnect();
      return;
    }
    
    // Call the addSigner function
    console.log('\nAttempting to add signer...');
    const txOptions = {
      gasLimit: 100000,
      storageDepositLimit: null,
    };
    
    // Execute the transaction
    const tx = await contract.tx.addSigner(
      txOptions,
      account.address
    );
    
    console.log('Signing and sending transaction...');
    const extrinsic = await tx.signAndSend(account);
    
    console.log(`Transaction sent: ${extrinsic.toHex()}`);
    console.log('Waiting for confirmation...');
    
    // Wait for event or timeout
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check whitelist status again
    const { result: result2, output: output2 } = await contract.query.whitelist(
      account.address,
      { gasLimit: -1 },
      account.address
    );
    
    const nowWhitelisted = output2.toJSON();
    console.log(`\nWhitelist status now: ${nowWhitelisted ? 'SUCCESS ✅' : 'FAILED ❌'}`);
    
    // Disconnect from the API
    await api.disconnect();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error(error);
  }
  
  console.log('\nOperation completed.');
}

// Run the script
interactWithContract().catch(console.error); 