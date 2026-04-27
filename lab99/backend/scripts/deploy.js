const hre = require("hardhat");
const fs   = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("==========================================");
  console.log("Deploying contracts with account:", deployer.address);

  const GameItems = await hre.ethers.getContractFactory("GameItems");
  const gameItems = await GameItems.deploy();
  await gameItems.waitForDeployment();

  const address = await gameItems.getAddress();
  console.log("✅ GameItems deployed!");
  console.log("📄 Contract Address:", address);
  console.log("🔗 Etherscan: https://sepolia.etherscan.io/address/" + address);
  console.log("==========================================");

  // ── Write address to .env for interact.js ────────────────
  const envPath = path.join(__dirname, "..", ".env");
  let envContent = fs.readFileSync(envPath, "utf8");
  if (envContent.includes("CONTRACT_ADDRESS=")) {
    envContent = envContent.replace(/CONTRACT_ADDRESS=.*/, `CONTRACT_ADDRESS="${address}"`);
  } else {
    envContent += `\nCONTRACT_ADDRESS="${address}"`;
  }
  fs.writeFileSync(envPath, envContent);
  console.log("✅ CONTRACT_ADDRESS saved to .env");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
