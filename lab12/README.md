# Lab 12: Creating Channels and Deploying Chaincode on Hyperledger Fabric

This project demonstrates the end-to-end setup of a Hyperledger Fabric network with multiple channels and real-time visualization through a premium React frontend.

## 🎯 Features
- **Real-time Data**: Directly connected to a live Hyperledger Fabric network (no mock data).
- **Multi-channel Support**: Uses channel `c1` for asset management.
- **Dynamic UI**: Built with React, Framer Motion, and Lucide icons for a premium experience.
- **Ledger Controls**: Initialize the ledger and transfer assets directly from the UI.

## 🚀 How to Run

### 1. Fabric Network (Already Running)
Ensure the Fabric test network is up and chaincode is deployed:
```bash
cd ~/go/src/github.com/archit/fabric-samples/test-network
./network.sh up createChannel -c c1
./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-go -ccl go -c c1
```

### 2. Backend (Already Running)
Connects to the Fabric Gateway.
```bash
cd lab12/backend
node server.js
```

### 3. Frontend (Already Running)
Visualizes the ledger.
```bash
cd lab12/frontend
npm run dev
```

## 🛠 Tech Stack
- **Blockchain**: Hyperledger Fabric
- **Backend**: Node.js, Express, Fabric Gateway SDK
- **Frontend**: React, Vite, Framer Motion, Axios
