# Blockchain Labs - Semester 2

A comprehensive collection of blockchain development labs focusing on smart contract development, deployment, and testing using modern blockchain technologies.

## 📚 Repository Structure

This repository is organized by lab number. Each lab focuses on specific blockchain concepts and implementations.

```
blockchain-sem2/
├── README.md           # This file
└── lab2/              # ERC-20 Token Implementation
    ├── contracts/
    ├── scripts/
    ├── test/
    └── README.md
```

## 🔬 Labs

### [Lab 2: ERC-20 Token Implementation](./lab2/)

Implementation of a custom ERC-20 token using Hardhat and Solidity.

**Topics Covered:**
- Smart contract development with Solidity
- ERC-20 token standard
- Hardhat development environment
- Smart contract testing
- Deployment scripts

**Tech Stack:** Hardhat, Solidity 0.8.24, Ethers.js

👉 **[View Lab 2 Details](./lab2/README.md)**

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **Git**

### Clone the Repository

```bash
git clone https://github.com/testing-archit/blockchain-labs-sem2.git
cd blockchain-sem2
```

### Navigate to a Specific Lab

Each lab has its own README with specific setup instructions:

```bash
# For Lab 2
cd lab2
npm install
npx hardhat test
```

## 🛠️ Common Commands

Most labs use Hardhat. Here are common commands you'll use:

```bash
# Install dependencies
npm install

# Run tests
npx hardhat test

# Run tests with gas reporting
REPORT_GAS=true npx hardhat test

# Start local Hardhat node
npx hardhat node

# Deploy contracts
npx hardhat run scripts/deploy.js

# Get help
npx hardhat help
```

## 📖 Learning Path

1. **Lab 2** - Start with basic ERC-20 token implementation to understand:
   - Smart contract structure
   - State variables and functions
   - Events and modifiers
   - Testing smart contracts
   - Deployment process

More labs coming soon...

## 🔐 Security Note

⚠️ **Educational Purpose Only**: These contracts are designed for learning purposes. Do not use them in production without proper security audits and additional safeguards.

## 📝 License

ISC

## 👨‍💻 Author

**Archit**

- GitHub: [@testing-archit](https://github.com/testing-archit)
- Repository: [blockchain-labs-sem2](https://github.com/testing-archit/blockchain-labs-sem2)

## 🤝 Contributing

This is a learning repository. Feel free to:
- Fork the repository
- Experiment with the code
- Add your own improvements
- Create pull requests with enhancements

## 📚 Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)

---

**Last Updated:** January 2026  
**Course:** Blockchain Development - Semester 2
