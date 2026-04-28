const { ethers } = require("hardhat");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to wrap readline in a promise
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  // Get available accounts
  const signers = await ethers.getSigners();
  const owner = signers[0];
  
  console.log("\n==================================");
  console.log("   🚀 Deploying Token Contract    ");
  console.log("==================================");
  
  const Token = await ethers.getContractFactory("Token");
  const token = await Token.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  
  const fs = require("fs");
  const path = require("path");
  const frontendEnvPath = path.join(__dirname, "..", "frontend", ".env");
  fs.writeFileSync(frontendEnvPath, `VITE_CONTRACT_ADDRESS=${tokenAddress}\n`);

  console.log(`✅ Token deployed to: ${tokenAddress}\n`);
  
  console.log("=== Available Test Accounts ===");
  signers.slice(0, 3).forEach((signer, index) => {
      console.log(`Account ${index + 1}: ${signer.address}`);
  });
  console.log("===============================\n");

  let exit = false;
  
  while (!exit) {
    console.log("\n--- Hardhat Token CLI Menu ---");
    console.log("1. Check Balance");
    console.log("2. Transfer Tokens (from Owner)");
    console.log("3. Exit");
    
    const choice = await question("\nSelect an option (1-3): ");
    
    switch (choice.trim()) {
      case "1":
        const address = await question("Enter address to check balance: ");
        try {
            const balance = await token.balanceOf(address);
            console.log(`\n💰 Balance: ${ethers.formatEther(balance)} HHT`);
        } catch (err) {
            console.log("\n❌ Error: Invalid address format.");
        }
        break;
        
      case "2":
        const to = await question("Enter recipient address: ");
        const amount = await question("Enter amount to send (in HHT): ");
        try {
            console.log(`\n⏳ Sending ${amount} HHT to ${to}...`);
            const tx = await token.transfer(to, ethers.parseEther(amount));
            await tx.wait();
            console.log(`✅ Success!`);
            console.log(`🔗 Transaction Hash: ${tx.hash}`);
        } catch (err) {
            console.log("\n❌ Transaction Failed!");
            console.log(`Reason: ${err.reason || err.shortMessage || err.message}`);
        }
        break;
        
      case "3":
        console.log("\n👋 Exiting CLI. Goodbye!");
        exit = true;
        break;
        
      default:
        console.log("\n⚠️ Invalid choice. Please select 1, 2, or 3.");
    }
  }
  
  rl.close();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
