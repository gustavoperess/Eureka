// submit‑invoice-fixed.js
// --------------------------------------------------------------
// VERSION MODIFIED FOR ETHERS v6 (Using FIXED Gas/Fees)
// --------------------------------------------------------------
require('dotenv').config();
// # v6 change: No functional change here, but v6 favors ES Modules (import) over require if project allows.
const { ethers } = require('ethers');

// --- Configuration ---
const RPC_URL   = 'https://westend-asset-hub-eth-rpc.polkadot.io';
const CHAIN_ID  = 420420421; // # v6 change: Chain ID might be bigint or number, keep as number for provider for now.
const CONTRACT  = '0x3C197333cFDa62bcd12FEdcEc43e0b6929110355';
const ABI       = require('./abi/contract-abi.json');

// --- Fee / Gas Constants ---
// # v6 change: Use ethers.parseUnits directly, results are bigint
const TIP_FEE         = ethers.parseUnits('20',  'gwei'); // Max priority fee (miner tip)
const MAX_FEE_FLOOR   = ethers.parseUnits('500', 'gwei'); // Minimum value for maxFeePerGas if calculated value is lower
const GAS_PER_WT      = 64n; // Already a bigint literal
const GAS_HARD_CAP    = 300_000n; // Already a bigint literal

// --- Helper Functions ---

/** Generates a random alphanumeric chunk (excluding easily confused chars). */
function rndChunk(n = 4) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let o = '';
  while (n--) o += chars[Math.floor(Math.random() * chars.length)];
  return o;
}

// --- Dynamic Fee Function (Not used in this version, kept for reference) ---
// NOTE: This function would also need updates for v6 (BigInt math) if reactivated.
/*
async function dynamicFees(provider) {
  try {
    const latestBlock = await provider.getBlock('latest');
    if (!latestBlock || !latestBlock.baseFeePerGas) {
        throw new Error('Could not fetch latest block or baseFeePerGas from RPC.');
    }
    // # v6 change: baseFeePerGas is likely already a bigint
    const baseFee = latestBlock.baseFeePerGas;

    // # v6 change: Use native bigint operators *, +, <
    let maxFee = baseFee * 2n + TIP_FEE;
    if (maxFee < MAX_FEE_FLOOR) {
        maxFee = MAX_FEE_FLOOR;
    }
    // # v6 change: Use ethers.formatUnits directly
    // console.log(`📈 Base Fee: ${ethers.formatUnits(baseFee, 'gwei')} Gwei`);
    // console.log(`   Tip Fee: ${ethers.formatUnits(TIP_FEE, 'gwei')} Gwei`);
    // console.log(`   Max Fee: ${ethers.formatUnits(maxFee, 'gwei')} Gwei`);
    return { maxFeePerGas: maxFee, maxPriorityFeePerGas: TIP_FEE };
  } catch (error) {
      console.error(`❌ Error fetching dynamic fees: ${error.message}`);
      console.warn('⚠️ Using fallback fixed fees due to error.');
      return {
          maxFeePerGas: ethers.parseUnits('600', 'gwei'), // # v6 change
          maxPriorityFeePerGas: ethers.parseUnits('30', 'gwei') // # v6 change
      };
  }
}
*/

// --- Main Execution Logic ---
(async () => {
  console.log('--- Starting Invoice Submission Script (Ethers v6 - FIXED Gas/Fees) ---');
  console.log(`Connecting to RPC: ${RPC_URL} (Chain ID: ${CHAIN_ID})`);
  console.log(`Target Contract: ${CONTRACT}`);

  // --- Provider Setup ---
  // # v6 change: providers namespace removed
  const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);

  // --- Wallet Address Verification ---
  const EXPECTED_WALLET_ADDRESS = '0xeb202166015976623cDe87d4f2cAeF41abdb7177';

  let loadedPrivateKey = process.env.PRIVATE_KEY;
  if (!loadedPrivateKey) {
      console.error('❌ FATAL: PRIVATE_KEY environment variable not set!');
      process.exit(1);
  }
  if (!loadedPrivateKey.startsWith('0x')) {
      loadedPrivateKey = `0x${loadedPrivateKey}`;
  }
  if (loadedPrivateKey.length !== 66) {
      console.warn(`⚠️ Warning: Private key length (${loadedPrivateKey.length}) is unusual. Expected 66 characters including '0x'.`);
  }

  // --- Signer (Wallet) Creation ---
  let wallet;
  try {
    // # v6 change: Wallet constructor largely the same
    wallet = new ethers.Wallet(loadedPrivateKey, provider);
  } catch (error) {
    console.error(`❌ FATAL: Failed to create wallet from private key: ${error.message}`);
    console.error('   Please ensure the PRIVATE_KEY is a valid 64-character hex string (optionally prefixed with 0x).');
    process.exit(1);
  }

  // --- Perform the Verification Check ---
  console.log(`🔑 Derived address from PRIVATE_KEY: ${wallet.address}`);
  if (EXPECTED_WALLET_ADDRESS === '0xYOUR_EXPECTED_WALLET_ADDRESS_HERE') {
      console.error('❌ FATAL: Placeholder EXPECTED_WALLET_ADDRESS has not been replaced!');
      console.error('   Please edit the script and set the correct expected address.');
      process.exit(1);
  }
  if (wallet.address.toLowerCase() !== EXPECTED_WALLET_ADDRESS.toLowerCase()) {
      console.error(`❌ FATAL: Wallet address mismatch!`);
      console.error(`   Expected: ${EXPECTED_WALLET_ADDRESS}`);
      console.error(`   Derived:  ${wallet.address}`);
      console.error(`   Please ensure the correct PRIVATE_KEY is set in your environment variables for the expected address.`);
      process.exit(1);
  } else {
      console.log(`✅ Wallet address matches the expected address.`);
  }

  // --- Contract Instance ---
  // # v6 change: Contract constructor largely the same
  const contract = new ethers.Contract(CONTRACT, ABI.abi, wallet);
  console.log(`Contract instance created for ${contract.target}`); // # v6 change: contract.address should still work, maps to target

  // --- Whitelist Check ---
  console.log(`Checking whitelist status for signer: ${wallet.address}...`);
  let isWhitelisted;
  try {
    isWhitelisted = await contract.whitelist(wallet.address);
    console.log(`Is whitelisted? ${isWhitelisted}`); // Should return boolean
  } catch (error) {
    console.error(`❌ Error checking whitelist status: ${error.message}`);
    console.error('   Could not read from contract. Check RPC connection and contract address/ABI.');
    return;
  }
  if (!isWhitelisted) {
    console.error(`❌ Signer ${wallet.address} is not whitelisted on contract ${CONTRACT}. Add it using the addSigner function.`);
    return;
  }

  // --- Generate Unique Invoice Data ---
  console.log('Generating unique invoice data...');
  let invoiceId, sha;
  let attempts = 0;
  const maxAttempts = 10;
  for (;;) {
    attempts++;
    if (attempts > maxAttempts) {
        console.error(`❌ Failed to generate unique invoice data after ${maxAttempts} attempts.`);
        return;
    }
    invoiceId = `INV-${rndChunk()}-${rndChunk()}`;
    // # v6 change: Access utils from top-level ethers object
    sha = ethers.keccak256(ethers.randomBytes(32));
    try {
        const inv = await contract.getInvoice(invoiceId);
        // # v6 change: result properties might be bigint. Check for zero with === 0n
        const isTimestampZero = inv.timestamp === 0n;
        const hashExists = await contract.shaExists(sha); // Returns boolean
        if (isTimestampZero && !hashExists) {
            console.log(`   Generated unique Hashcode: ${invoiceId}`);
            console.log(`   Generated unique SHA hash (for check): ${sha}`);
            break;
        } else {
             console.log(`   Attempt ${attempts}: Data conflict found (Hashcode: ${!isTimestampZero}, SHA: ${hashExists}). Retrying...`);
        }
    } catch (error) {
        console.error(`❌ Error checking invoice/hash uniqueness: ${error.message}`);
        return;
    }
  }
  const hashToSubmit = sha;

  // --- Static Call (Simulation) ---
  console.log(`Simulating submitInvoice(${hashToSubmit}, ${invoiceId})...`);
  try {
    // # v6 change: callStatic syntax remains the same. contract.FUNCTION.staticCall(ARGS) also exists.
    await contract.submitInvoice.staticCall(hashToSubmit, invoiceId); // Using explicit staticCall method
    console.log('   Simulation successful.');
  } catch (error) {
    console.error(`❌ Simulation failed: ${error.message}`);
    // # v6 change: Error structure might differ slightly, but check data property
    if (error.data) {
        try {
            // # v6 change: contract.interface should still exist
            const decodedError = contract.interface.parseError(error.data);
            console.error(`   Contract revert reason: ${decodedError?.name}(${decodedError?.args.join(', ')})`);
        } catch (parseError) { console.error(`   Could not decode revert data: ${error.data}`); }
    } else {
        console.error(`   Error details:`, error); // Log full error if no data field
    }
    console.error('   Cannot proceed with transaction.');
    return;
  }

  // --- Define FIXED Gas/Fee Values ---
  // # v6 change: Use BigInt() constructor or n suffix for literals
  const fixedGasLimit = 300000n; // Use n suffix for bigint literal
  // # v6 change: Use ethers.parseUnits
  const fixedMaxFeePerGas = ethers.parseUnits('550', 'gwei');
  const fixedMaxPriorityFeePerGas = ethers.parseUnits('30', 'gwei');

  // --- Send Transaction ---
  console.log(`Submitting Invoice: ${invoiceId} with hash ${hashToSubmit}`);
  // # v6 change: Use ethers.formatUnits
  console.log(`   USING FIXED Gas Limit: ${fixedGasLimit.toString()}`);
  console.log(`   USING FIXED Max Fee Per Gas: ${ethers.formatUnits(fixedMaxFeePerGas, 'gwei')} Gwei`);
  console.log(`   USING FIXED Max Priority Fee Per Gas: ${ethers.formatUnits(fixedMaxPriorityFeePerGas, 'gwei')} Gwei`);

  let tx;
  try {
    // # v6 change: Pass options object with bigint values
    tx = await contract.submitInvoice(hashToSubmit, invoiceId, {
        gasLimit: fixedGasLimit,
        maxFeePerGas: fixedMaxFeePerGas,
        maxPriorityFeePerGas: fixedMaxPriorityFeePerGas
     });
    console.log(`⛓  Transaction sent! Hash: ${tx.hash}`);
    console.log(`   Waiting for transaction receipt...`);
  } catch (error) {
    console.error(`❌ Transaction submission failed: ${error.message}`);
    // # v6 change: Check error codes if needed (may differ from v5)
    if (error.code) console.error(`   Error Code: ${error.code}`);
    if (error.data) console.error(`   Error Data: ${error.data}`);
    return; // Stop if submission fails
  }

  // --- Wait for Transaction Receipt ---
  try {
    // # v6 change: tx.wait() likely returns similar receipt object, check properties
    const rc = await tx.wait();
    if (!rc) {
        console.error('❌ Transaction receipt was null.');
        return;
    }
    console.log(`✅ Transaction included in Block ${rc.blockNumber}`);
    // # v6 change: gasUsed and effectiveGasPrice should be bigint
    console.log(`   Gas Used: ${rc.gasUsed.toString()}`);
    console.log(`   Effective Gas Price: ${ethers.formatUnits(rc.effectiveGasPrice, 'gwei')} Gwei`);
    console.log(`   Status: ${rc.status === 1 ? 'Success' : 'Failed'}`);

    if (rc.status === 1) {
        const existsAfter = await contract.shaExists(hashToSubmit); // Returns boolean
        console.log(`   Verification: shaExists(${hashToSubmit.substring(0,10)}...) after tx? ${existsAfter}`);
    } else {
         console.error(`❌ Transaction failed on-chain (Status 0). Check block explorer for hash: ${tx.hash}`);
    }

  } catch (error) {
      console.error(`❌ Error waiting for transaction receipt: ${error.message}`);
      // # v6 change: Check error codes and structure
      const transactionHash = error.transactionHash || tx?.hash; // Try to get hash
      if (error.code === 'CALL_EXCEPTION' && transactionHash) {
          console.error(`   Transaction reverted on-chain. Hash: ${transactionHash}`);
          console.error('   Attempting to get revert reason from receipt block...');
          // # v6 change: Need to verify provider.call and error parsing logic still works
          try {
               // NOTE: Getting error.receipt might not work reliably in v6 error objects.
               // Re-fetching might be needed, or use data from the original error if available.
               // Trying a simpler approach first: check error.data if present
               if (error.data) {
                   const decodedError = contract.interface.parseError(error.data);
                   console.error(`   ❌ Contract reverted with: ${decodedError?.name}(${decodedError?.args.join(', ')})`);
               } else {
                   console.error(`   Could not decode revert reason (no data field in error).`);
               }
          } catch (revertError) {
              console.error(`   Error trying to decode revert reason: ${revertError.message}`);
          }
      } else if (error.code === 'TRANSACTION_REPLACED') {
            console.warn(`⚠️ Transaction was replaced (likely speed-up or cancel).`);
            if (error.replacement) console.log(`   New Tx Hash: ${error.replacement.hash}`);
            if (error.receipt) console.log(`   Original Tx Receipt (now orphaned): Block ${error.receipt.blockNumber}`);
      } else {
           console.error(`   Raw error:`, error);
      }
  }

  console.log('--- Script Finished ---');

})().catch(error => {
    console.error("💥 Unhandled error in script execution:", error);
    process.exit(1);
});