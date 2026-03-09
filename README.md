# Blockchain Labs — Semester 2

A comprehensive collection of blockchain development labs focusing on smart contract development, deployment, and testing using modern blockchain technologies.

## 📚 Repository Structure

```
blockchain-sem2/
├── lab2/   ERC-20 Token Implementation
├── lab3/   Smart Contract Security & Deployment
├── lab4/   Web3.js Blockchain Interactions
├── lab5/   Storage DApp (Hardhat + React)
├── lab6/   University Credentials DApp
└── README.md
```

## 🔬 Labs

### [Lab 2: ERC-20 Token Implementation](./lab2/)
Custom ERC-20 token built with Hardhat and Solidity.
**Topics:** ERC-20 standard, token minting, transfer, allowances, Hardhat testing.

### [Lab 3: Smart Contract Security & Deployment](./lab3/)
Smart contract with vulnerability analysis and Sepolia testnet deployment.
**Topics:** Solidity security, reentrancy, access control, Etherscan verification.

### [Lab 4: Web3.js Blockchain Interactions](./lab4/)
8 hands-on tasks exploring the Sepolia testnet with Web3.js.
**Topics:** Block/transaction inspection, account balances, sending ETH, gas analysis, event subscriptions.

### [Lab 5: Storage DApp](./lab5/)
Full-stack DApp with a role-based Storage contract and React frontend.
**Topics:** Access control, allowlists, ownership transfer, MetaMask integration.

### [Lab 6: University Credentials DApp](./lab6/)
Decentralised credential management system with admin issuance and on-chain verification.
**Topics:** Struct mappings, credential hashing, admin access control, React frontend.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v14+) / **Bun**
- **npm**
- **Git**
- **MetaMask** (for DApp labs)

### Clone the Repository

```bash
git clone https://github.com/testing-archit/blockchain-labs-sem2.git
cd blockchain-sem2
```

Each lab has its own README with setup instructions — navigate into a lab folder to get started.

## 🛠️ Common Commands

```bash
npm install                # Install dependencies
npx hardhat compile        # Compile contracts
npx hardhat test           # Run tests
npx hardhat node           # Start local node
npx hardhat run scripts/deploy.js --network localhost
```

## 🔐 Security Note

⚠️ **Educational Purpose Only** — These contracts are for learning. Do not use in production without proper audits.

## 👨‍💻 Author

**Archit** — [@testing-archit](https://github.com/testing-archit)

---

**Last Updated:** March 2026
**Course:** Blockchain Development — Semester 2
