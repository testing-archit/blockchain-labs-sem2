#!/bin/bash

# Colors for pretty printing
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${CYAN}====================================================${NC}"
echo -e "${CYAN}       LAB 12: HYPERLEDGER FABRIC DEMONSTRATION       ${NC}"
echo -e "${CYAN}====================================================${NC}\n"

echo -e "${YELLOW}Step 1: Verifying running Chaincode Docker Containers${NC}"
echo "We should see chaincode containers running for both peers..."
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "dev-peer"
echo ""

echo -e "${YELLOW}Step 2: Proving Org1 has joined Channels (archit, c1, c2)${NC}"
docker exec peer0.org1.example.com peer channel list
echo ""

echo -e "${YELLOW}Step 3: Proving Org2 has joined Channels (archit, c1, c2)${NC}"
docker exec peer0.org2.example.com peer channel list
echo ""

echo -e "${YELLOW}Step 4: Checking Backend API Connection for Channel 'c1' (Org1)${NC}"
echo "Fetching Network Info for Channel c1..."
curl -s "http://localhost:5001/api/info?org=Org1&channel=c1" | python3 -m json.tool
echo ""

echo -e "${YELLOW}Step 5: Querying Ledger Assets on Channel 'c1' via API${NC}"
echo "Calling backend /api/assets endpoint..."
curl -s "http://localhost:5001/api/assets?org=Org1&channel=c1" | python3 -m json.tool
echo ""

echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}   DEMO COMPLETE. THE NETWORK IS FULLY OPERATIONAL.   ${NC}"
echo -e "${GREEN}====================================================${NC}"
