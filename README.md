# Blockchain Labs - Semester 2

This repository contains blockchain development labs using Hardhat, focusing on smart contract development and deployment on Ethereum.

## 📋 Lab 2: ERC-20 Token Implementation

This lab demonstrates the implementation of a basic ERC-20 token smart contract using Hardhat and Solidity.

### 🔧 Tech Stack

- **Hardhat**: Development environment for Ethereum software
- **Solidity**: ^0.8.24
- **Node.js**: Runtime environment
- **Ethers.js**: Ethereum library for blockchain interactions

### 📁 Project Structure

```
lab2/
├── contracts/          # Smart contracts
│   └── Token.sol      # ERC-20 Token contract
├── scripts/           # Deployment scripts
│   └── deploy.js      # Token deployment script
├── test/              # Test files
│   └── Token.js       # Token contract tests
├── hardhat.config.js  # Hardhat configuration
└── package.json       # Project dependencies
```

### 🚀 Getting Started

#### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

#### Installation

1. Clone the repository:
```bash
git clone https://github.com/testing-archit/blockchain-labs-sem2.git
cd blockchain-labs-sem2/lab2
```

2. Install dependencies:
```bash
npm install
```

### 💡 Features

The `Token.sol` contract includes:

- **Token Details**:
  - Name: My Hardhat Token
  - Symbol: MHT
  - Total Supply: 1,000,000 tokens

- **Core Functions**:
  - `transfer(address to, uint256 amount)`: Transfer tokens to another address
  - `balanceOf(address account)`: Check the token balance of an account
  - Event emission for transfer tracking

### 🧪 Available Commands

```bash
# Display available Hardhat commands
npx hardhat help

# Run tests
npx hardhat test

# Run tests with gas reporting
REPORT_GAS=true npx hardhat test

# Start a local Hardhat node
npx hardhat node

# Deploy the contract
npx hardhat run scripts/deploy.js

# Deploy using Hardhat Ignition (if configured)
npx hardhat ignition deploy ./ignition/modules/Lock.js
```

### 🧪 Running Tests

The project includes comprehensive tests for the Token contract:

```bash
npx hardhat test
```

Tests verify:
- ✅ Total supply is correctly assigned to the owner
- ✅ Token transfers work correctly between accounts

### 📝 Smart Contract Overview

#### Token.sol

The Token contract is a simplified ERC-20 implementation that demonstrates:

1. **State Variables**:
   - Token name, symbol, and total supply
   - Owner address
   - Balance mapping for all addresses

2. **Constructor**:
   - Assigns total supply to the deployer's address
   - Sets the contract deployer as the owner

3. **Transfer Function**:
   - Validates sufficient balance before transfer
   - Updates sender and recipient balances
   - Emits Transfer event

4. **Balance Query**:
   - Read-only function to check account balances

### 🔐 Security Considerations

This is a basic educational implementation. For production use, consider:
- Implementing full ERC-20 standard (approve, transferFrom, allowance)
- Adding access control mechanisms
- Implementing SafeMath or using Solidity 0.8+ built-in overflow protection
- Conducting professional security audits

### 📚 Learning Objectives

- Understanding smart contract development workflow
- Working with Hardhat development environment
- Implementing basic token functionality
- Writing and running smart contract tests
- Deploying contracts to local and test networks

### 🤝 Contributing

This is a learning repository. Feel free to fork and experiment!

### 📄 License

ISC

### 👨‍💻 Author

Archit

---

**Note**: This project is for educational purposes as part of Blockchain course work (Semester 2).
