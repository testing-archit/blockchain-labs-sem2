#!/bin/bash

# Default configs
ORG="Org1"
CHANNEL="c1"
API_URL="http://localhost:5001/api"

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

while true; do
    echo -e "\n${CYAN}========================================${NC}"
    echo -e "${CYAN}   Hyperledger Fabric Interactive CLI   ${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo -e "Current Target: [ Org: ${YELLOW}$ORG${NC} | Channel: ${YELLOW}$CHANNEL${NC} ]\n"
    
    echo "1. Change Organization (Org1 / Org2)"
    echo "2. Change Channel (c1 / c2 / archit)"
    echo "3. Initialize Ledger (Creates base assets)"
    echo "4. View All Assets"
    echo "5. Query Single Asset"
    echo "6. Transfer Asset"
    echo "7. View Network/Connection Info"
    echo "8. Exit"
    
    echo ""
    read -p "Select an option [1-8]: " OPTION
    echo ""
    
    case $OPTION in
        1)
            read -p "Enter Org (Org1 or Org2): " NEW_ORG
            if [[ "$NEW_ORG" == "Org1" || "$NEW_ORG" == "Org2" ]]; then
                ORG=$NEW_ORG
                echo -e "${GREEN}Organization successfully set to $ORG${NC}"
            else
                echo -e "${RED}Invalid Org. Must be Org1 or Org2.${NC}"
            fi
            ;;
        2)
            read -p "Enter Channel (c1, c2, archit): " NEW_CHANNEL
            CHANNEL=$NEW_CHANNEL
            echo -e "${GREEN}Channel successfully set to $CHANNEL${NC}"
            ;;
        3)
            echo -e "${YELLOW}Submitting InitLedger transaction...${NC}"
            curl -s -X POST -H "Content-Type: application/json" -d "{\"org\":\"$ORG\",\"channel\":\"$CHANNEL\"}" $API_URL/init | python3 -m json.tool
            ;;
        4)
            echo -e "${YELLOW}Evaluating GetAllAssets query...${NC}"
            curl -s "$API_URL/assets?org=$ORG&channel=$CHANNEL" | python3 -m json.tool
            ;;
        5)
            read -p "Enter Asset ID (e.g., asset1): " ASSET_ID
            echo -e "${YELLOW}Evaluating ReadAsset for $ASSET_ID...${NC}"
            curl -s "$API_URL/asset/$ASSET_ID?org=$ORG&channel=$CHANNEL" | python3 -m json.tool
            ;;
        6)
            read -p "Enter Asset ID to transfer: " ASSET_ID
            read -p "Enter New Owner's Name: " NEW_OWNER
            echo -e "${YELLOW}Submitting TransferAsset transaction...${NC}"
            curl -s -X POST -H "Content-Type: application/json" -d "{\"assetId\":\"$ASSET_ID\",\"newOwner\":\"$NEW_OWNER\",\"org\":\"$ORG\",\"channel\":\"$CHANNEL\"}" $API_URL/transfer | python3 -m json.tool
            ;;
        7)
            echo -e "${YELLOW}Fetching Active Network Information...${NC}"
            curl -s "$API_URL/info?org=$ORG&channel=$CHANNEL" | python3 -m json.tool
            ;;
        8)
            echo -e "${GREEN}Exiting CLI... Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option. Please choose a number between 1 and 8.${NC}"
            ;;
    esac
done
