const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy SecureVault
  const SecureVault = await hre.ethers.getContractFactory("SecureVault");
  const vault = await SecureVault.deploy();
  await vault.waitForDeployment();

  const contractAddress = vault.target;
  console.log("✅ SecureVault deployed to:", contractAddress);

  // Save the address to a file for use by other scripts
  fs.writeFileSync("deployed-address.txt", contractAddress);
  console.log("📝 Contract address saved to deployed-address.txt");

  console.log("\n-------------------------------------------");
  console.log("🎉 Deployment complete!");
  console.log("Run 'npx hardhat run scripts/interact.js --network sepolia' to deposit/withdraw");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
