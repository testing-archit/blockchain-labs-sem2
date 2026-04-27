# VaultStay: Web3 Escrow & IPFS Storage (Lab 10)

VaultStay is a premium decentralized application (DApp) that combines Ethereum smart contracts with IPFS for secure, encrypted file storage and escrow-based property rentals.

## Features

- **Decentralized Storage**: Upload files to IPFS with automatic encryption.
- **Smart Contract Escrow**: Secure payments and rental agreements handled on-chain.
- **AES-256 Encryption**: Client-side encryption ensures data privacy before it ever reaches IPFS.
- **Vite-powered Frontend**: A modern, responsive UI for managing listings and storage.

## Project Structure

- **`contracts/`**: Solidity smart contracts (`IPFSStorage.sol`) for handling file CIDs and escrow logic.
- **`ipfs-storage/`**: The main application folder.
  - **`src/`**: React frontend built with Vite.
  - **`backend/`**: Express server acting as a gateway for IPFS pinning and encryption utilities.

## Getting Started

### 1. Smart Contract Deployment

1. Install root dependencies:
   ```bash
   npm install
   ```

2. Compile and deploy the contract:
   ```bash
   npx hardhat compile
   npx hardhat run scripts/deploy.js --network localhost
   ```

### 2. IPFS Gateway (Backend)

1. Navigate to the backend:
   ```bash
   cd ipfs-storage/backend
   npm install
   ```

2. Configure `.env` with your IPFS (Pinata/Infura) credentials.

3. Start the server:
   ```bash
   npm start
   ```

### 3. Frontend

1. Navigate to the frontend:
   ```bash
   cd ipfs-storage
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

## Technologies Used

- **Solidity**: Smart contract logic.
- **Hardhat**: Development and testing framework.
- **React & Vite**: Frontend UI.
- **Ethers.js v6**: Web3 integration.
- **IPFS**: Decentralized file storage.
- **CryptoJS**: AES-256 encryption.
- **Express**: Middleware gateway.
