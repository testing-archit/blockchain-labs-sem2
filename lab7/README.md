# ArchitToken (Lab 7) - ERC20 Token DApp

This project demonstrates a full-stack decentralized application (DApp) for an ERC20 token named **ArchitToken (AT)**. It includes the Ethereum smart contract written in Solidity, Hardhat scripts for deployment and interaction, and a React-based frontend frontend to interact with the token on the Sepolia testnet.

## Project Structure

- **`contracts/`**: Contains the Solidity smart contract (`ArchitToken.sol`).
- **`scripts/`**: Contains scripts to deploy the contract and interact with it programmatically (e.g., `deploy.js`, `transfer.js`, `check_account.js`).
- **`frontend/`**: Contains the React application for the user interface.

## Smart Contract

`ArchitToken` is an ERC20 token built using the OpenZeppelin library.
- **Name**: archit_token
- **Symbol**: AT
- **Initial Supply**: 100,000 AT (minted to the deployer's address).
- **Network**: Deployed on the Sepolia testnet.

## Getting Started

### Prerequisites
- Node.js (v16+)
- MetaMask browser extension configured for the Sepolia testnet
- Sepolia Eth for gas fees

### Installation

1. Install project dependencies (Hardhat & Smart Contract):
   ```bash
   npm install
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

### Running the Project

1. **Smart Contract Deployment**
   To deploy the token again (if needed), use the hardhat script:
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```
   *(Update the deployed address in `frontend/src/utils/contract.js` if you deploy a new instance).*

2. **Starting the Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   Open your browser to the local URL provided by Vite (usually `http://localhost:5173`).

---

## Frontend Documentation & Function Mappings

The frontend is built with React and uses `ethers.js` (v6) to communicate with the Ethereum blockchain via MetaMask. 

### 1. Main Application (`App.jsx`)

The main entry point handles wallet connections, network validation, and rendering the dashboard.

**Key Functions & State:**
- **`account` / `provider`**: React state variables holding the connected wallet address and the ethers `BrowserProvider`.
- **`useEffect` (Initialization)**: Sets up event listeners for `accountsChanged` and `chainChanged` from `window.ethereum`.
- **`connectWallet()`**: 
  - Validates MetaMask installation.
  - Checks if the current network is Sepolia (Chain ID: `11155111` or `0xaa36a7`). If not, it requests MetaMask to switch chains via `wallet_switchEthereumChain`.
  - Requests account access using `eth_requestAccounts`.
  - Instantiates `ethers.BrowserProvider` and retrieves the user's signer.
- **`switchAccount()`**: 
  - Forces the MetaMask popup to allow the user to select a different account using `wallet_requestPermissions`.

### 2. Dashboard Component (`TokenDashboard.jsx`)

Once connected, this component renders the user's balance and interfaces for token transfers and approvals.

**Smart Contract Interactions:**
All contract interactions use the deployed address and ABI loaded from `utils/contract.js`.

- **Initialization (`initContract` & `fetchBalance`)**:
  - **Called On**: Component mount or when `provider`/`account` changes.
  - **Action**: Initializes an `ethers.Contract` instance.
  - **Contract Function Called**: `contract.symbol()` to get the "AT" symbol, and `contract.balanceOf(account)` to retrieve the current user's balance.

- **Transferring Tokens (`handleTransfer`)**:
  - **Triggered By**: Submitting the "Transfer" form.
  - **Action**: Sends tokens from the connected wallet to a specified `recipient`.
  - **Contract Function Called**: `contract.transfer(transferTo, parsedAmount)`
  - **Note**: The amount is formatted to 18 decimals using `ethers.parseUnits` before sending.


### 3. Utilities (`utils/contract.js`)

- Contains `CONTRACT_ADDRESS`: The deployed address of `ArchitToken` on the Sepolia network.
- Contains `CONTRACT_ABI`: The human-readable ABI array defining the specific view and state-modifying functions (e.g., `balanceOf`, `transfer`) used by the DApp.
