#!/bin/bash

# Colors for pretty printing
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}====================================================${NC}"
echo -e "${CYAN}     LAB 12: END-TO-END EXECUTION & INITIALIZATION    ${NC}"
echo -e "${CYAN}====================================================${NC}\n"

TEST_NETWORK_DIR="$HOME/go/src/github.com/archit/fabric-samples/test-network"

echo -e "${YELLOW}Step 1: Initializing Channels on the Fabric Network${NC}"
echo "We use the standard Hyperledger Fabric network.sh script to initialize channels."
echo "Navigating to Fabric test-network..."
cd $TEST_NETWORK_DIR

# Initialize Channel c1
echo -e "\n${CYAN}>>> Creating Channel 'c1'${NC}"
./network.sh createChannel -c c1
echo -e "\n${CYAN}>>> Deploying 'basic' chaincode to Channel 'c1'${NC}"
./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-go -ccl go -c c1

# Initialize Channel c2
echo -e "\n${CYAN}>>> Creating Channel 'c2'${NC}"
./network.sh createChannel -c c2
echo -e "\n${CYAN}>>> Deploying 'basic' chaincode to Channel 'c2'${NC}"
./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-go -ccl go -c c2
echo ""

echo -e "${YELLOW}Step 2: Proving Channels are Initialized on Peers${NC}"
echo -e "${CYAN}>>> Peer0 Org1 Channels (We should see c1 and c2 here):${NC}"
docker exec peer0.org1.example.com peer channel list
echo -e "${CYAN}>>> Peer0 Org2 Channels (We should see c1 and c2 here):${NC}"
docker exec peer0.org2.example.com peer channel list
echo ""

echo -e "${YELLOW}Step 3: Interacting with the Chaincode via Backend API${NC}"
cd /Users/archit/Desktop/Archive/projects/blockchain-sem2/lab12

echo -e "\n${CYAN}>>> 3a. Initializing the Ledger on Channel 'c1' with base assets...${NC}"
curl -s -X POST -H "Content-Type: application/json" -d '{"org":"Org1","channel":"c1"}' http://localhost:5001/api/init | python3 -m json.tool
echo "Waiting 3 seconds for transaction to commit..."
sleep 3

echo -e "\n${CYAN}>>> 3b. Querying all assets on Channel 'c1' to verify initialization...${NC}"
curl -s "http://localhost:5001/api/assets?org=Org1&channel=c1" | python3 -m json.tool

echo -e "\n${CYAN}>>> 3c. Executing a Transaction: Transferring 'asset1' to 'Professor' on Channel 'c1'...${NC}"
curl -s -X POST -H "Content-Type: application/json" -d '{"assetId":"asset1","newOwner":"Professor","org":"Org1","channel":"c1"}' http://localhost:5001/api/transfer | python3 -m json.tool
echo "Waiting 3 seconds for transaction to commit..."
sleep 3

echo -e "\n${CYAN}>>> 3d. Verifying the transfer (Reading asset1 to confirm new owner is 'Professor')...${NC}"
curl -s "http://localhost:5001/api/asset/asset1?org=Org1&channel=c1" | python3 -m json.tool

echo -e "\n${GREEN}====================================================${NC}"
echo -e "${GREEN}   EXECUTION COMPLETE. CHANNELS INITIALIZED & TESTED. ${NC}"
echo -e "${GREEN}====================================================${NC}"
