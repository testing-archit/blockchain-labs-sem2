import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as readline from "readline";

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

async function main() {
  const contractAddress = process.env.DEPLOYED_CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("Set DEPLOYED_CONTRACT_ADDRESS in your .env file.");
    process.exit(1);
  }

  const signers = await ethers.getSigners();
  const signer = signers[0];
  const contract = await ethers.getContractAt("CollectibleCertificate", contractAddress, signer);

  console.log("==========================================");
  console.log("    NFT Smart Contract Interactive CLI    ");
  console.log("==========================================");
  console.log(`Connected to Network with account: ${signer.address}`);
  console.log(`Contract Address: ${contractAddress}`);
  console.log("==========================================");

  let running = true;
  while (running) {
    console.log("\nWhat would you like to do?");
    console.log("1. Check Balance (balanceOf)");
    console.log("2. Check Token Owner (ownerOf)");
    console.log("3. Mint NFT (ownerMint)");
    console.log("4. Approve operator (approve)");
    console.log("5. Transfer Token (safeTransferFrom)");
    console.log("6. Get Total Minted (totalMinted)");
    console.log("7. View Token Metadata (tokenURI & IPFS content)");
    console.log("8. Exit");
    
    const choice = await question("\nEnter your choice (1-8): ");

    try {
      switch (choice.trim()) {
        case "1": {
          const address = await question("Enter address to check balance (default is your address): ");
          const targetAddress = address.trim() || signer.address;
          const balance = await contract.balanceOf(targetAddress);
          console.log(`\n=> Balance of ${targetAddress}: ${balance} NFTs`);
          break;
        }
        case "2": {
          const tokenIdStr = await question("Enter Token ID: ");
          const tokenId = parseInt(tokenIdStr);
          if (isNaN(tokenId)) throw new Error("Invalid Token ID");
          const owner = await contract.ownerOf(tokenId);
          console.log(`\n=> Owner of Token #${tokenId} is: ${owner}`);
          break;
        }
        case "3": {
          const toAddress = await question("Enter destination address (default is your address): ");
          const targetAddress = toAddress.trim() || signer.address;
          const uri = await question("Enter metadata URI (e.g. ipfs://...): ");
          console.log("\nMinting...");
          const tx = await contract.ownerMint(targetAddress, uri || "ipfs://default-cli-uri");
          console.log(`Transaction submitted! Hash: ${tx.hash}`);
          const receipt = await tx.wait();
          
          let mintedId = "unknown";
          if (receipt && receipt.logs) {
            for (const log of receipt.logs) {
              try {
                // Ignore any logs that might not be parsable by this contract
                const parsedLog = contract.interface.parseLog({ topics: [...log.topics], data: log.data });
                if (parsedLog?.name === "CollectibleMinted") {
                  mintedId = parsedLog.args[2].toString(); // tokenId is the 3rd argument
                }
              } catch (e) {
                // Not our event, skip
              }
            }
          }
          console.log(`=> Mint successful! Your new Token ID is: #${mintedId}`);
          break;
        }
        case "4": {
          const operator = await question("Enter Operator Address to approve: ");
          const tokenIdStr = await question("Enter Token ID: ");
          const tokenId = parseInt(tokenIdStr);
          if (isNaN(tokenId)) throw new Error("Invalid Token ID");
          
          console.log(`\nApproving...`);
          const tx = await contract.approve(operator, tokenId);
          console.log(`Transaction submitted! Hash: ${tx.hash}`);
          await tx.wait();
          console.log(`=> Successfully approved ${operator} for Token #${tokenId}`);
          break;
        }
        case "5": {
          const toAddress = await question("Enter Recipient Address: ");
          const tokenIdStr = await question("Enter Token ID: ");
          const tokenId = parseInt(tokenIdStr);
          if (isNaN(tokenId)) throw new Error("Invalid Token ID");
          
          console.log(`\nTransferring...`);
          const tx = await contract["safeTransferFrom(address,address,uint256)"](signer.address, toAddress, tokenId);
          console.log(`Transaction submitted! Hash: ${tx.hash}`);
          await tx.wait();
          console.log(`=> Successfully transferred Token #${tokenId} to ${toAddress}`);
          break;
        }
        case "6": {
          const total = await contract.totalMinted();
          console.log(`\n=> Total NFTs minted so far: ${total}`);
          break;
        }
        case "7": {
          const tokenIdStr = await question("Enter Token ID: ");
          const tokenId = parseInt(tokenIdStr);
          if (isNaN(tokenId)) throw new Error("Invalid Token ID");
          const uri = await contract.tokenURI(tokenId);
          console.log(`\n=> Token URI for #${tokenId}: ${uri}`);
          
          if (uri.startsWith("ipfs://")) {
            const httpsUri = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
            console.log(`\nFetching metadata directly from: ${httpsUri}...`);
            try {
              const response = await fetch(httpsUri);
              if (response.ok) {
                const data = await response.json();
                console.log("\n====== IPFS METADATA ======");
                console.log(JSON.stringify(data, null, 2));
                console.log("===========================");
              } else {
                console.log(`\n[!] Failed to fetch from IPFS: ${response.statusText}`);
              }
            } catch (e: any) {
              console.log(`\n[!] Could not fetch IPFS data automatically: ${e.message}`);
            }
          } else if (uri.startsWith("http")) {
            console.log(`\nFetching metadata directly from: ${uri}...`);
            try {
              const response = await fetch(uri);
              if (response.ok) {
                const data = await response.json();
                console.log("\n====== HTTP METADATA ======");
                console.log(JSON.stringify(data, null, 2));
                console.log("===========================");
              } else {
                console.log(`\n[!] Failed to fetch from HTTP: ${response.statusText}`);
              }
            } catch (e: any) {
              console.log(`\n[!] Could not fetch HTTP data automatically: ${e.message}`);
            }
          }
          break;
        }
        case "8": {
          console.log("Exiting CLI...");
          running = false;
          break;
        }
        default:
          console.log("Invalid choice. Please try again.");
      }
    } catch (err: any) {
      console.error(`\n[!] Error during execution: ${err.message || err}`);
    }
  }

  rl.close();
}

main().catch((error) => {
  console.error((error as Error).message);
  process.exitCode = 1;
});
