require("dotenv").config();
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying IPFSStorage to Sepolia...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📬 Deployer address:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "ETH\n");

  const Factory = await hre.ethers.getContractFactory("IPFSStorage");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ IPFSStorage deployed at:", address);
  console.log("\n🔗 Sepolia Etherscan:");
  console.log(`   https://sepolia.etherscan.io/address/${address}`);

  // Write address to a JSON file for the frontend
  const fs = require("fs");
  const deployData = {
    address,
    network: "sepolia",
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };
  fs.writeFileSync(
    "./src/deployedContract.json",
    JSON.stringify(deployData, null, 2)
  );
  console.log("\n📝 Saved to src/deployedContract.json");
}

main().catch((err) => { console.error(err); process.exit(1); });
