const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  // Create real, valid Ethereum addresses on the fly for the test targets
  const addr1 = ethers.Wallet.createRandom();
  const addr2 = ethers.Wallet.createRandom();
  const Token = await ethers.getContractFactory("Token");
  const token = await Token.deploy();
  await token.waitForDeployment();

  const address = await token.getAddress();
  console.log("Token deployed to:", address);

  // --- SAVE TO FRONTEND .env ---
  const frontendEnvPath = path.join(__dirname, "..", "frontend", ".env");
  fs.writeFileSync(frontendEnvPath, `VITE_CONTRACT_ADDRESS=${address}\n`);
  console.log("✅ Contract address saved to frontend/.env");

  // Transaction 1: Success
  console.log("\n--- Transaction 1: Transferring to Addr1 ---");
  const tx1 = await token.transfer(addr1.address, ethers.parseEther("100"));
  await tx1.wait();
  console.log("Transaction 1 (Owner -> Addr1) Hash:", tx1.hash);

  // Transaction 2: Success
  console.log("\n--- Transaction 2: Transferring to Addr2 ---");
  const tx2 = await token.transfer(addr2.address, ethers.parseEther("50"));
  await tx2.wait();
  console.log("Transaction 2 (Owner -> Addr2) Hash:", tx2.hash);

  // Transaction 3: Failure (Owner tries to send more than totalSupply)
  try {
    console.log("\n--- Attempting Transaction 3 (Insufficient Balance) ---");
    // Owner tries to send 2 million tokens (supply is 1 million)
    const tx3 = await token.transfer(addr1.address, ethers.parseEther("2000000"));
    await tx3.wait();
  } catch (error) {
    console.log("Transaction 3 Failed as expected!");
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
