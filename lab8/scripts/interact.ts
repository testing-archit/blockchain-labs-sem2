import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const INTERACTION_IPFS_URI = "ipfs://bafybeiadcertificate3metadataaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

async function main() {
  const contractAddress = process.env.DEPLOYED_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("Set DEPLOYED_CONTRACT_ADDRESS in your .env file before running this script.");
  }

  const [signer] = await ethers.getSigners();
  const contract = await ethers.getContractAt("CollectibleCertificate", contractAddress, signer);

  if (!(await contract.publicMintEnabled())) {
    await (await contract.setPublicMintEnabled(true)).wait();
    console.log("Public mint toggled on.");
  }

  const mintFee = await contract.mintFee();
  const mintTx = await contract.publicMint(INTERACTION_IPFS_URI, { value: mintFee });
  const mintReceipt = await mintTx.wait();

  const mintedTokenId = await contract.totalMinted();
  const owner = await contract.ownerOf(mintedTokenId);
  const metadataUri = await contract.tokenURI(mintedTokenId);

  console.log(`Minted token #${mintedTokenId} in tx ${mintReceipt?.hash}`);
  console.log(`Owner: ${owner}`);
  console.log(`Metadata URI: ${metadataUri}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
