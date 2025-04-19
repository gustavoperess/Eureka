require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();          // pull RPC_URL & PRIVATE_KEY

module.exports = {
  solidity: '0.8.20',
  networks: {
    westend: {
      url: process.env.RPC_URL || 'https://westend-asset-hub-eth-rpc.polkadot.io',
      chainId: 420420421,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
