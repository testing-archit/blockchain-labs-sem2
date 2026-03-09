# Lab 4: Web3.js Blockchain Interactions

Hands-on exploration of the Ethereum Sepolia testnet using **Web3.js**. This lab covers reading blockchain data, inspecting transactions, sending ETH, and analyzing gas prices — all from Node.js scripts.

## 📋 Tasks Covered

| # | Task | Script |
|---|------|--------|
| 1 | Connect to Ethereum Testnet (Infura) | `connect.js` |
| 2 | Fetch Block Information | `blockInfo.js` |
| 3 | Network & Node Information | `networkInfo.js` |
| 4 | Transaction Inspection | `transactionInfo.js` |
| 5 | Account & Balance Analysis | `accountInfo.js` |
| 6 | Send a Real Testnet Transaction | `sendTx.js` |
| 7 | Event Subscription (Real-Time) | `subscribe.js` |
| 8 | Gas Price & Network Analysis | `gasAnalysis.js` |

> Run all tasks sequentially with `node runAll.js`

## 🛠️ Tech Stack

- **Web3.js** v4 — Ethereum JavaScript API
- **Infura** — Sepolia RPC provider
- **Node.js** — Runtime

## 🚀 Getting Started

```bash
cd lab4
npm install
node runAll.js
```

For individual tasks:

```bash
node blockInfo.js
node sendTx.js
node subscribe.js   # runs continuously — Ctrl+C to stop
```

## 📁 Project Structure

```
lab4/
├── connect.js           # Web3 provider setup (Infura Sepolia)
├── blockInfo.js         # Fetch latest & specific block data
├── networkInfo.js       # Chain ID, network ID, client version
├── transactionInfo.js   # Inspect a transaction & its receipt
├── accountInfo.js       # Wallet balance & nonce lookup
├── sendTx.js            # Sign & send ETH on Sepolia
├── subscribe.js         # Subscribe to newBlockHeaders & pendingTx
├── gasAnalysis.js       # Current gas price analysis
├── runAll.js            # Runs tasks 1-8 sequentially
└── package.json
```
