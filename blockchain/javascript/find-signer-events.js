// find-signer-events.js
const { ethers } = require('ethers');

const RPC = 'https://westend-asset-hub-eth-rpc.polkadot.io';
const CONTRACT = '0x3C197333cFDa62bcd12FEdcEc43e0b6929110355';
const ABI = [
  'event SignerAdded(address indexed signer)',
  'event SignerRemoved(address indexed signer)'
];

(async () => {
  const provider = new ethers.providers.JsonRpcProvider(RPC);
  const iface    = new ethers.utils.Interface(ABI);

  // topics for the events
  const addedTopic   = iface.getEventTopic('SignerAdded');
  const removedTopic = iface.getEventTopic('SignerRemoved');

  // filter for *your* address
  const me = '0xeb202166015976623cDe87d4f2cAeF41abdb7177'.toLowerCase();
  const topicMe = ethers.utils.hexZeroPad(me, 32);

  const logs = await provider.getLogs({
    address: CONTRACT,
    fromBlock: 0,
    topics: [
      [addedTopic, removedTopic], // either event
      topicMe                      // indexed signer == you
    ]
  });

  if (!logs.length) {
    console.log('No SignerAdded / SignerRemoved logs for this address.');
    return;
  }
  logs.forEach(l => {
    const { name } = iface.parseLog(l);
    console.log(
      `${name} in block ${l.blockNumber}`
    );
  });
})();
