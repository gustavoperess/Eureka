// hardhat.config.cjs  (CommonJS syntax)
require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

module.exports = {
  solidity: '0.8.20',
  networks: {
    westend: {
      url: process.env.RPC_URL || 'https://evm-westend.publicnode.com',
      // chainId for Westend Asset‑Hub EVM pallet
      chainId: 420420421,
      accounts: [process.env.PRIVATE_KEY],
      timeout: 300000                // 5‑minute RPC timeout
    }
  }
};
