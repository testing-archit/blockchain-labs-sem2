const hre = require("hardhat");

async function main() {
  const SecureVault = await hre.ethers.getContractFactory("SecureVault");
  const vault = await SecureVault.deploy();

  await vault.waitForDeployment();

  console.log("SecureVault deployed to:", vault.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
