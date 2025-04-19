# submit_invoice_py.py
# Switched to FIXED EIP-1559 Fees
import os
import json
import random
import string
import time
from dotenv import load_dotenv
from web3 import Web3

# --- Configuration ---
load_dotenv()

RPC_URL = 'https://westend-asset-hub-eth-rpc.polkadot.io'
CONTRACT_ADDRESS = Web3.to_checksum_address('0x19C8500bf08dDc7941801Fb629a4307C2bCdcD7E')
EXPECTED_WALLET_ADDRESS = Web3.to_checksum_address('0xeb202166015976623cDe87d4f2cAeF41abdb7177')
ABI_PATH = './abi/contract-abi.json'
NATIVE_TOKEN_DECIMALS = 12 # Assuming 12 for WND

# --- Fixed Transaction Parameters ---
FIXED_GAS_LIMIT = 300000
# Define FIXED EIP-1559 fees (matching last ethers.js attempt)
FIXED_MAX_FEE_PER_GAS_GW_GWEI = 550 # In Gwei for readability
FIXED_MAX_PRIORITY_FEE_PER_GAS_GWEI = 30 # In Gwei for readability

# --- Helper Functions ---

def load_abi(filepath):
    """Loads ABI from a JSON file."""
    try:
        script_dir = os.path.dirname(__file__)
        if not script_dir:
             script_dir = '.'
        full_path = os.path.join(script_dir, filepath)
        with open(full_path, 'r') as f:
            abi_data = json.load(f)
            if isinstance(abi_data, dict) and 'abi' in abi_data:
                return abi_data['abi']
            elif isinstance(abi_data, list):
                 return abi_data
            else:
                 raise ValueError("ABI file has unexpected format.")
    except FileNotFoundError:
        print(f"❌ FATAL: ABI file not found at {full_path}")
        exit(1)
    except (json.JSONDecodeError, KeyError, ValueError) as e:
        print(f"❌ FATAL: Could not parse ABI file or unexpected format in {full_path}: {e}")
        exit(1)

def rnd_chunk(n=4):
    """Generates a random alphanumeric chunk (Python version)."""
    chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return ''.join(random.choice(chars) for _ in range(n))

# --- Main Execution Logic ---

def main():
    print('--- Starting Invoice Submission Script (Python / Web3.py - EIP-1559 Fees) ---')
    print(f"Connecting to RPC: {RPC_URL}")
    print(f"Target Contract: {CONTRACT_ADDRESS}")

    # --- Web3 Connection ---
    w3 = Web3(Web3.HTTPProvider(RPC_URL))

    if not w3.is_connected():
        print("❌ FATAL: Failed to connect to RPC.")
        exit(1)
    print(f"Connected! Chain ID: {w3.eth.chain_id}")

    # --- Load Private Key & Verify Address ---
    private_key = os.getenv('PRIVATE_KEY')
    if not private_key:
        print('❌ FATAL: PRIVATE_KEY environment variable not set!')
        exit(1)
    if not private_key.startswith('0x'):
        private_key = '0x' + private_key

    try:
        account = w3.eth.account.from_key(private_key)
        derived_address = account.address
        print(f"🔑 Derived address from PRIVATE_KEY: {derived_address}")
    except Exception as e:
        print(f"❌ FATAL: Failed to load account from private key: {e}")
        exit(1)

    if derived_address.lower() != EXPECTED_WALLET_ADDRESS.lower():
        print(f"❌ FATAL: Wallet address mismatch!")
        exit(1)
    else:
        print(f"✅ Wallet address matches the expected address.")

    # --- Check Balance (Informational) ---
    print(f"Checking native token balance for: {derived_address}...")
    try:
        balance_wei = w3.eth.get_balance(derived_address)
        balance_native = balance_wei / (10**NATIVE_TOKEN_DECIMALS)
        print(f"💰 Account Balance: {balance_wei} wei ({balance_native:.6f} WND - assuming {NATIVE_TOKEN_DECIMALS} decimals)")
    except Exception as e:
        print(f"❌ Error checking balance: {e}")

    # --- Load ABI & Contract Instance ---
    contract_abi = load_abi(ABI_PATH)
    contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=contract_abi)
    print(f"Contract instance created for {contract.address}")

    # --- Whitelist Check ---
    print(f"Checking whitelist status for signer: {derived_address}...")
    try:
        is_whitelisted = contract.functions.whitelist(derived_address).call()
        print(f"Is whitelisted? {is_whitelisted}")
        if not is_whitelisted:
            print(f"❌ Signer {derived_address} is not whitelisted. Exiting.")
            exit(1)
    except Exception as e:
        print(f"❌ Error checking whitelist status: {e}")
        exit(1)

    # --- Generate Unique Invoice Data ---
    print('Generating unique invoice data...')
    # [Keep the existing unique data generation loop as before]
    invoice_id = None
    hash_bytes_to_submit = None
    attempts = 0
    max_attempts = 10
    while attempts < max_attempts:
        attempts += 1
        temp_invoice_id = f"INV-{rnd_chunk()}-{rnd_chunk()}"
        temp_hash_bytes = os.urandom(32)
        try:
            inv_data = contract.functions.getInvoice(temp_invoice_id).call()
            hash_exists = contract.functions.shaExists(temp_hash_bytes).call()
            is_timestamp_zero = inv_data[3] == 0
            if is_timestamp_zero and not hash_exists:
                invoice_id = temp_invoice_id
                hash_bytes_to_submit = temp_hash_bytes
                print(f"   Generated unique Hashcode: {invoice_id}")
                print(f"   Generated unique Hash bytes (for submission): {hash_bytes_to_submit.hex()}")
                break
            else:
                 print(f"   Attempt {attempts}: Data conflict found (Hashcode: {not is_timestamp_zero}, Hash: {hash_exists}). Retrying...")
                 time.sleep(0.1)
        except Exception as e:
            print(f"❌ Error checking invoice/hash uniqueness: {e}")
            exit(1)
    else:
        print(f"❌ Failed to generate unique invoice data after {max_attempts} attempts.")
        exit(1)


    # --- Build Transaction ---
    print(f"Attempting to submit Invoice: {invoice_id} with hash 0x{hash_bytes_to_submit.hex()}")
    try:
        nonce = w3.eth.get_transaction_count(derived_address)

        # Convert Gwei values to Wei for the transaction parameters
        max_fee_per_gas_wei = w3.to_wei(FIXED_MAX_FEE_PER_GAS_GW_GWEI, 'gwei')
        max_priority_fee_per_gas_wei = w3.to_wei(FIXED_MAX_PRIORITY_FEE_PER_GAS_GWEI, 'gwei')

        print(f"   Using Nonce: {nonce}")
        print(f"   USING FIXED Max Fee Per Gas: {FIXED_MAX_FEE_PER_GAS_GW_GWEI} Gwei ({max_fee_per_gas_wei} wei)")
        print(f"   USING FIXED Max Priority Fee Per Gas: {FIXED_MAX_PRIORITY_FEE_PER_GAS_GWEI} Gwei ({max_priority_fee_per_gas_wei} wei)")
        print(f"   Using Fixed Gas Limit: {FIXED_GAS_LIMIT}")

        # Build transaction dictionary using EIP-1559 parameters
        tx_params = {
            'from': derived_address,
            'chainId': w3.eth.chain_id,
            'gas': FIXED_GAS_LIMIT,
            'maxFeePerGas': max_fee_per_gas_wei,
            'maxPriorityFeePerGas': max_priority_fee_per_gas_wei,
            'nonce': nonce,
            'value': 0, # Explicitly set value to 0
            'type': '0x2' # Explicitly set type to EIP-1559
        }

        submit_tx = contract.functions.submitInvoice(
            hash_bytes_to_submit,
            invoice_id
        ).build_transaction(tx_params)
        print("   Transaction built...")

        signed_tx = w3.eth.account.sign_transaction(submit_tx, private_key)
        print("   Transaction signed...")

        # --- Send Transaction ---
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        print(f"⛓  Transaction sent! Hash: {tx_hash.hex()}")

        # --- Wait for Receipt ---
        print("   Waiting for transaction receipt (timeout 120s)...")
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

        print(f"✅ Transaction included in Block {receipt['blockNumber']}")
        print(f"   Gas Used: {receipt['gasUsed']}")
        print(f"   Effective Gas Price: {w3.from_wei(receipt.get('effectiveGasPrice', 0), 'gwei')} Gwei") # EIP-1559 receipts have effectiveGasPrice

        if receipt['status'] == 1:
            print(f"   Status: Success")
            exists_after = contract.functions.shaExists(hash_bytes_to_submit).call()
            print(f"   Verification: shaExists(0x{hash_bytes_to_submit.hex()[:8]}...) after tx? {exists_after}")
        else:
            print(f"❌ Status: Failed (Status 0)")
            print(f"   Transaction failed on-chain. Check block explorer for hash: {tx_hash.hex()}")
            # Still likely the 'NotAuthorised' issue, but hard to confirm reason from web3.py error

    except Exception as e:
        print(f"❌ An error occurred during transaction processing: {e}")
        error_str = str(e).lower()
        # Check if it's the misleading balance error again, although less likely with EIP-1559
        if "'code': 1010" in error_str and "balance too low" in error_str:
            print("   >>> Received 'Insufficient Funds' error from node (potentially misleading). <<<")
        elif 'revert' in error_str or 'execution reverted' in error_str or 'invalid opcode' in error_str:
             print("   Transaction likely reverted on-chain.")
        if isinstance(e, AttributeError):
            import traceback
            traceback.print_exc()

    print('--- Script Finished ---')

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"💥 Unhandled error in script execution: {e}")
        import traceback
        traceback.print_exc()
        exit(1)