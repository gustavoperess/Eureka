require('dotenv').config();
const { ethers } = require("ethers");
const fs = require("fs");

// Setup provider and signer
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// ABI placeholder (insert your compiled contract ABI here)
const abi = require("./EurekaInvoiceRegistryABI.json"); // <- Save ABI as JSON
const contractAddress = process.env.CONTRACT_ADDRESS;

const contract = new ethers.Contract(contractAddress, abi, signer);

async function submitInvoice(pdfPath, hashcode) {
    const buffer = fs.readFileSync(pdfPath);
    const hash = ethers.utils.sha256(buffer); // SHA-256 of PDF
  
    const tx = await contract.submitInvoice(hash, hashcode);
    await tx.wait();
  
    console.log("Invoice submitted:", hashcode);
  }

async function revokeInvoice(hashcode) {
    const tx = await contract.revokeInvoice(hashcode);
    await tx.wait();
    console.log("Invoice revoked:", hashcode);
}

async function completeInvoice(hashcode) {
    const tx = await contract.completeInvoice(hashcode);
    await tx.wait();
    console.log("Invoice marked as completed:", hashcode);
}

async function getInvoice(hashcode) {
    const invoice = await contract.getInvoice(hashcode);
    console.log(invoice);
}

async function checkIfExists(pdfPath) {
    const buffer = fs.readFileSync(pdfPath);
    const hash = ethers.utils.sha256(buffer);
    const exists = await contract.shaExists(hash);
    console.log("Exists?", exists);
}

async function addSigner(signerAddress) {
    const tx = await contract.addSigner(signerAddress);
    await tx.wait();
    console.log("Signer added:", signerAddress);
  }
  
async function removeSigner(signerAddress) {
    const tx = await contract.removeSigner(signerAddress);
    await tx.wait();
    console.log("Signer removed:", signerAddress);
}

async function pauseContract() {
    const tx = await contract.pause();
    await tx.wait();
    console.log("Contract paused");
  }
  
async function unpauseContract() {
    const tx = await contract.unpause();
    await tx.wait();
    console.log("Contract unpaused");
}
