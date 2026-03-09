# Lab 6: University Credentials DApp

A decentralised application for issuing, viewing, and updating university credentials on the Ethereum blockchain. An **admin** can issue credentials to student addresses; anyone can verify them on-chain.

## ✨ Features

### Smart Contract (`UniversityCredentials.sol`)
- **Admin-only issuance** — `addCredential(student, name, course, docHash)`
- **Public verification** — `getCredentials(student)` returns all credentials
- **Credential updates** — admin can update a document hash via `updateCredential`
- **Integrity check** — `computeHash(name, course)` for off-chain verification
- **Events** — `CredentialAdded`, `CredentialUpdated`

### Frontend (React + Vite)
- MetaMask wallet connection
- Admin panel for issuing & updating credentials
- Student view for browsing issued credentials
- Modern, responsive UI

## 🛠️ Tech Stack

- **Hardhat** — Compilation, testing, deployment
- **Solidity** ^0.8.27
- **React + Vite** — Frontend
- **Ethers.js** — Contract interaction
- **MetaMask** — Wallet provider

## 🚀 Getting Started

### 1. Smart Contract

```bash
cd lab6/hardhat
npm install
npx hardhat compile
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

### 2. Frontend

```bash
cd lab6/frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and connect MetaMask.

## 📁 Project Structure

```
lab6/
├── hardhat/
│   ├── contracts/
│   │   └── UniversityCredentials.sol
│   ├── scripts/
│   ├── test/
│   ├── hardhat.config.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── App.css
    │   ├── components/
    │   └── config.json
    ├── index.html
    └── package.json
```
