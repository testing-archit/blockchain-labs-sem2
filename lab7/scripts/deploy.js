const hre = require("hardhat");

async function main() {
  const ArchitToken = await hre.ethers.getContractFactory("ArchitToken");
  const token = await ArchitToken.deploy();

  await token.waitForDeployment();

  console.log(`ArchitToken deployed to: ${await token.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
