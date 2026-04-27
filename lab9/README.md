# ERC-1155 RPG Game Lab (Lab 9)

This lab implements a multi-token system using the **ERC-1155** standard for an RPG game inventory. It includes a smart contract for managing various game assets (sword, shield, potion, etc.) and a React frontend to interact with the inventory.

## Project Structure

- **`backend/`**: Hardhat project containing the `GameItems.sol` contract and deployment scripts.
- **`frontend/`**: React application built with Vite and Ethers.js for the game interface.

## Smart Contract Details

The `GameItems` contract uses OpenZeppelin's ERC-1155 implementation.
- **Tokens**:
  - ID 0: Sword
  - ID 1: Shield
  - ID 2: Health Potion
  - ID 3: Magic Wand
  - ID 4: Dragon Egg (Rare)
- **Features**:
  - Batch minting and transfers.
  - Metadata URI support.
  - Admin access control.

## Getting Started

### 1. Backend Setup (Smart Contract)

1. Navigate to the backend directory:
   ```bash
   cd backend
   npm install
   ```

2. Compile the contracts:
   ```bash
   npx hardhat compile
   ```

3. Deploy to local network (optional):
   ```bash
   npx hardhat node
   npx hardhat run scripts/deploy.js --network localhost
   ```

### 2. Frontend Setup (React App)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:5173` in your browser and connect MetaMask.

## Features

- **Connect Wallet**: Integrated with MetaMask.
- **Inventory View**: See your balances for each game item.
- **Transfer Items**: Send single or multiple items to other players using ERC-1155 batch transfer functionality.
- **Minting**: Admin interface to mint new items into existence.
