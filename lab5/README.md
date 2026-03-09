# Lab 5: Storage DApp — Hardhat + React

A full-stack decentralised application built around a **Storage** smart contract with role-based access control, ownership transfer, and an allowlist system. The frontend is a React + Vite app that connects via MetaMask.

## ✨ Features

### Smart Contract (`Storage.sol`)
- **Value storage** — read / write a `uint256` with `getValue` / `setValue`
- **Ownership** — transferable via `transferOwnership`
- **Allowlist** — owner can `grantAccess` / `revokeAccess` to other users
- **Reset** — owner can reset value to 0
- **Events** — `ValueChanged`, `OwnershipTransferred`, `AccessGranted`, `AccessRevoked`, `ValueReset`

### Frontend
- MetaMask wallet connection with account switching
- Admin / Student role detection
- Live contract value display and updates
- Modern, responsive UI

## 🛠️ Tech Stack

- **Hardhat** — Solidity compilation, testing, local node
- **Solidity** ^0.8.20
- **React + Vite** — Frontend
- **Ethers.js / Web3.js** — Contract interaction
- **MetaMask** — Wallet provider

## 🚀 Getting Started

### 1. Smart Contract

```bash
cd lab5
npm install          # or bun install
npx hardhat compile
npx hardhat node     # start local node
npx hardhat run scripts/deploy.js --network localhost
```

### 2. Frontend

```bash
cd frontend
npm install          # or bun install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and connect MetaMask to `localhost:8545`.

## 📁 Project Structure

```
lab5/
├── contracts/
│   └── Storage.sol          # Main smart contract
├── scripts/
│   ├── deploy.js            # Deployment script
│   ├── check-code.js        # Utility scripts
│   ├── check-owner.js
│   └── fund-account.js
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main React component
│   │   └── contract.js      # Contract ABI & address
│   └── ...
├── hardhat.config.js
└── package.json
```
