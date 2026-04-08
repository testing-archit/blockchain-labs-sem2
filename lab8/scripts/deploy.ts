import { ethers } from "hardhat";

const SAMPLE_IPFS_URIS = [
  "ipfs://bafybeiadcertificate1metadataaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "ipfs://bafybeiadcertificate2metadataaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
];

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const deployerAddress = await deployer.getAddress();
  const secondaryAddress = signers.length > 1 ? await signers[1].getAddress() : "0x0000000000000000000000000000000000000001";

  const mintFee = ethers.parseEther("0.01");
  const maxSupply = 1000;

  const CollectibleCertificate = await ethers.getContractFactory("CollectibleCertificate");
  const contract = await CollectibleCertificate.deploy(
    "Semester 2 Certificates",
    "SEM2",
    mintFee,
    maxSupply,
    deployerAddress
  );

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  console.log(`CollectibleCertificate deployed at ${contractAddress}`);

  const firstMintTx = await contract.ownerMint(deployerAddress, SAMPLE_IPFS_URIS[0]);
  await firstMintTx.wait();
  console.log(`Token #1 minted to ${await contract.ownerOf(1)} with URI ${await contract.tokenURI(1)}`);

  const secondMintTx = await contract.ownerMint(secondaryAddress, SAMPLE_IPFS_URIS[1]);
  await secondMintTx.wait();
  console.log(`Token #2 minted to ${await contract.ownerOf(2)} with URI ${await contract.tokenURI(2)}`);

  await (await contract.setPublicMintEnabled(true)).wait();
  console.log("Public mint enabled. You can now run scripts/interact.ts to mint with a fee.");

  // Automatically update the .env file with the new contract address
  const fs = require("fs");
  const path = require("path");
  const envPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    let envData = fs.readFileSync(envPath, "utf8");
    if (envData.includes("DEPLOYED_CONTRACT_ADDRESS=")) {
      // Replace existing contract address entry
      envData = envData.replace(/DEPLOYED_CONTRACT_ADDRESS=.*/g, `DEPLOYED_CONTRACT_ADDRESS="${contractAddress}"`);
    } else {
      // Append if it doesn't exist
      envData += `\nDEPLOYED_CONTRACT_ADDRESS="${contractAddress}"\n`;
    }
    fs.writeFileSync(envPath, envData, "utf8");
    console.log(`Updated .env with DEPLOYED_CONTRACT_ADDRESS="${contractAddress}"`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
