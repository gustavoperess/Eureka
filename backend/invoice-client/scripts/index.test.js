require('dotenv').config();
const { expect } = require("chai");
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Load contract and methods
const abi = require("../EurekaInvoiceRegistryABI.json");
const {
  submitInvoice,
  revokeInvoice,
  completeInvoice,
  getInvoice,
  checkIfExists,
} = require("../index");

// Setup
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, signer);

describe("EurekaInvoiceRegistry Tests", function () {
  const hashcode = `INV-${Math.floor(Math.random() * 10000)}-TEST`;
  const pdfPath = path.join(__dirname, "sample.pdf"); // Place a test PDF here

  before(async function () {
    // Ensure contract is deployed
    const code = await provider.getCode(contract.address);
    expect(code).to.not.equal("0x");
  });

  it("should submit a new invoice", async function () {
    await submitInvoice(pdfPath, hashcode);
    const invoice = await contract.getInvoice(hashcode);
    expect(invoice.hashcode).to.equal(hashcode);
    expect(invoice.revoked).to.equal(false);
    expect(invoice.completed).to.equal(false);
  });

  it("should confirm that SHA-256 hash exists", async function () {
    const buffer = fs.readFileSync(pdfPath);
    const hash = ethers.utils.sha256(buffer);
    const exists = await contract.shaExists(hash);
    expect(exists).to.equal(true);
  });

  it("should complete the invoice", async function () {
    await completeInvoice(hashcode);
    const invoice = await getInvoice(hashcode);
    expect(invoice.completed).to.equal(true);
  });

  it("should not allow revoking a completed invoice", async function () {
    try {
      await revokeInvoice(hashcode);
      throw new Error("Expected revert not received");
    } catch (err) {
      expect(err.message).to.include("AlreadyCompleted");
    }
  });
});