import fs        from 'fs';
import crypto    from 'crypto';
import 'dotenv/config.js';
import { ethers } from 'ethers';
import abiJson    from '../artifacts/contracts/EurekaInvoiceRegistry.sol/EurekaInvoiceRegistry.json' assert { type: 'json' };

const PDF_PATH = process.argv[2];           // pass Invoice.pdf as CLI arg
const CODE     = process.argv[3] || 'INV-0000-0000';
const REG_ADDR = process.argv[4] || '0xDeployedAddressHere';

if (!PDF_PATH) throw new Error('usage: node submit.js <file.pdf> [code] [address]');

const pdf   = fs.readFileSync(PDF_PATH);
const md5   = '0x' + crypto.createHash('md5').update(pdf).digest('hex');  // 16‑byte hash

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// sign the raw 16 bytes (not the 0x prefix)
const sig = await signer.signMessage(ethers.getBytes(md5));

const registry = new ethers.Contract(REG_ADDR, abiJson.abi, signer);
const tx = await registry.submitInvoice(md5, CODE, sig);
console.log('⏳ waiting…'); await tx.wait();
console.log('✅ stored, tx:', tx.hash);
