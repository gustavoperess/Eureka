# Problem Statement
<pre>

Alice receives a fake bill from Bob for her utility bill, to her ADDRESS with an AMOUNT for company X
Alice believes this to be the true utility bill and she pays the money but instead of it going to company X it goes Bob, so Alice has fallen victim to FRAUD
We need to solve this problem, but instead of trying to do like a bank where we take action after the FRAUD we try to prevent it from happening
We want to solve this using blockchain but the problem is blockchain is public, so instead of storing the private data on chain we just store a hash
We generate the appropriate hash using the smart contract
</pre>

# Smart Contract
<pre>
The smart contract is a self-executing program stored on a blockchain that automatically enforces and executes the terms of an agreement once predefined conditions are met
</pre>

## Properties of smart contract:
<pre>
* 🧠 Logic-Based: It contains the business logic (like “if X happens, then do Y”).
* 🔒 Trustless: No need for a middleman — the blockchain ensures everything runs as coded.
* 📜 Immutable: Once deployed, it can’t be altered (unless there’s an upgrade mechanism built in).
* 🧾 Transparent: Everyone can see the code and how it operates on public blockchains.
</pre>

## NFTs
<pre>
We can thus represent the given utility bill defined in the problem statement as a Non Fungible Token (NFT). This is because we want each contract to be unique, non replicable and thus using NFTs to represent utility bills is a perfect use case for NFTs. 
ERC-721
Ethereum defines NFTs using the ERC-721 standard, this is the specific standard we’ll be using in our solidity smart contracts.
ERC-721 Key Properties
The key properties of ERC-721 are summarized below
🎯 Uniqueness:
Each token is distinct and has a unique tokenId. No two are the same.
👤 Ownership:
Tracks who owns each token using the ownerOf(tokenId) function.
🔄 Transferability:
Tokens can be transferred between addresses using transferFrom() or safeTransferFrom().
📦 Metadata:
Each token can point to off-chain metadata via tokenURI(tokenId) (e.g., artwork, attributes).
🛡️ Approval System:
Owners can approve others to manage their tokens (approve() and setApprovalForAll()).
🧩 Interoperability:
Recognized by marketplaces and dApps that support the ERC-721 standard.
You can view the full properties from EIP-721
</pre>

## Utility NFT (UNFT)
<pre>
How do we use NFTs to solve the problem defined in the problem statement? Well one solution would be to provide the information required for each contract in the metadata attribute; the metadata would be stored off chain and only the unique identifier (hash) of the contract and the NFT would be stored on chain. 

To solve our problem the company issuing the invoice mints an NFT, this NFT has a hash which is published on-chain. The metadata associated with the given NFT is stored off-chain, and is what contains the sensitive data associated with the bill. 

How can the customer access this metadata without repeating the problem defined in the problem statement? Well there are two ways: one would be for the user to receive a code from the company for each bil via email, this code would then be used in the API to access the metadata; the second more complex solution would be to have a keypair associated with each company the customer has a bill from, then each time the company issues a bill they send the metadata encrypted and then the customer can decrypt it using their key (this avoid the need to issue codes each time a bill is issued which reduces the attack vector). We should initially do this off-chain, using the former suggested solution, (due to the time constraints of the hackathon) however as future steps we could look into implementing more secure methods such as ZKPs and meta data storage using DKG. 
</pre>

## Suggested attributes to include in the metadata are:

<pre>
Invoice number: unique identifier for the invoice
Invoice date: the date the invoice was issued
Payment due date: the date the payment is expected to be made
Seller/supplier information: name, address, and contact information
Buyer/customer information: name, address, and contact information
Description of goods or services: a clear and concise description of what is being sold
Quantity: the number of items or services being invoiced
Unity Price: the price of each individual item or service
Subtotal: the total cost of the goods or services before any taxes or discounts
Taxes: any applicable taxes, such as VAT
Discounts: any applicable discounts
Total amount due: the final amount the customer owes
Payment terms: specify the timeframe for payment
Accepted payment methods: methods that the seller accepts
Company logo
Additional information of instructions

Since all of this is private sensitive data, it’s important that this information is stored, retrieved and transferred in a safe, trustable and verifiable way. Using traditional web2 methods where the data is stored off-chain in private servers and queried with API is the only feasible option in the given time window, however we plan to move to more secure solutions using ZKPs and DKG in the future.
</pre>