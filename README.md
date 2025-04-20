# Polkadot x EasyA Hackathon

This project is our submission for the Polkadot x EasyA Hackathon, the plan we used for the hackathon is in Eureka.pdf.

# Eureka Blockchain

Offers a blockchain-backed invoice fraud prevention to help users detect fake bills via hash comparison with simple UI.

# VIDEO DEMO: https://www.youtube.com/watch?v=j1cVEVN0Vtg

# Problem Statement
* Fraud is a huge worldwide problem, according a report by Verafin (NASDAQ), it's estimated that total losses from fraud totalled $485.6 billion in 2023 alone (source: [Verafin](https://nd.nasdaq.com/rs/303-QKM-463/images/2024-Global-Financial-Crime-Report-Nasdaq-Verafin-20240115.pdf))
* In the UK business fraud is also big problem, in 2022, £1.2 billion was stolen from UK businesses through invoice fraud alone (source: [UK Finance](https://www.ukfinance.org.uk/policy-and-guidance/reports-and-publications/annual-fraud-report-2023))

* Conventional approaches act only after fraud has already been committed, by which point irreversible damage to reputation, finances, and trust may have occurred.
We aim to prevent fraud rather than deal with its consequences after it has been committed,
using blockchain technology hence Eureka Blockchain.

Simplification of invoice fraud:
<pre>
1. Alice receives a fake bill from Bob for her utility bill, to her ADDRESS with an AMOUNT for company X
2. Alice believes this to be the true utility bill and she pays the money but instead of it going to company X it goes Bob, so Alice has fallen victim to FRAUD
3. We need to solve this problem, but instead of trying to do like a bank where we take action after the FRAUD we try to prevent it from happening
4. We want to solve this using blockchain but the problem is blockchain is public, so instead of storing the private data on chain we just store a hashes which we generate using smart contracts, this way no private data is exposed as this is also in private infrastructure.
</pre>

# Technical Solution

🚀 Tech Stack
	•	🌐 Polkadot Asset Hub
	•	🐘 PostgreSQL
	•	🧪 Supabase
	•	⚡ FastAPI
	•	🛠 Solidity
	•	🔤 Next.js
	•	🎨 Tailwind CSS v3

🛠️ Local Deployment Guide

To deploy locally on your machine:

🔧 Backend Setup
	1.	Navigate to the backend directory:
    2.	Install dependencies with pip:
    ``pip install -r requirements.txt``

🎨 Frontend Deployment Guide

🧾 Stamping Frontend

1. 
cd frontend/stamping/web
npm run dev

🟢 Runs at: http://localhost:5001


✅ Verify Frontend

cd frontend/verify/web
npm run dev

🟢 Runs at: http://localhost:5000


## Smart Contract
We chose to use a smark contract because of the following properties:

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

# Future Steps

Given the time constraints we did not manage to implement as much as we wanted, as future steps we could look into implementing more secure methods such as ZKPs and meta data storage using DKG. 
