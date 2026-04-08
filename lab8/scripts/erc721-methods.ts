import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * This script demonstrates the usage of all core ERC-721 functions.
 */
async function main() {
  const contractAddress = process.env.DEPLOYED_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("Set DEPLOYED_CONTRACT_ADDRESS in your .env file before running this script.");
  }

  const signers = await ethers.getSigners();
  const owner = signers[0];
  // If we only have 1 signer, we will use some dummy addresses for operator/recipient
  const operatorAddress = signers.length > 1 ? signers[1].address : "0x0000000000000000000000000000000000000002";
  const recipientAddress = signers.length > 2 ? signers[2].address : "0x0000000000000000000000000000000000000003";

  const contract = await ethers.getContractAt("CollectibleCertificate", contractAddress, owner);
  
  console.log(`Connected to contract at ${contractAddress}`);

  // Need a token to interact with. Let's find the current total supply from our custom extension.
  const totalMinted = await contract.totalMinted();
  
  // If no tokens exist, we mint one to demonstrate functions.
  let tokenId = totalMinted;
  if (tokenId === 0n) {
      console.log("No tokens minted yet. Minting token #1 to demonstrate.");
      const mintTx = await contract.ownerMint(owner.address, "ipfs://demotoken");
      await mintTx.wait();
      tokenId = await contract.totalMinted();
  } else {
      // Let's just mint a fresh one to guarantee we own it for the demo
      console.log(`Minting a fresh token to demonstrate.`);
      const mintTx = await contract.ownerMint(owner.address, `ipfs://demotoken-${Date.now()}`);
      await mintTx.wait();
      tokenId = await contract.totalMinted();
  }

  console.log(`\n--- Using token ID #${tokenId} for demonstration ---`);

  // 1. ownerOf
  let tokenOwner = await contract.ownerOf(tokenId);
  console.log(`ownerOf(${tokenId}): ${tokenOwner}`);

  // 2. balanceOf
  const balance = await contract.balanceOf(tokenOwner);
  console.log(`balanceOf(${tokenOwner}): ${balance}`);

  if (tokenOwner !== owner.address) {
     console.log("Token is not owned by the primary signer. Please run interaction with the correct account or mint a new one to demonstrate approvals/transfers.");
     return;
  }

  // 3. approve
  console.log(`\nApproving operator (${operatorAddress}) for token #${tokenId}...`);
  const approveTx = await contract.approve(operatorAddress, tokenId);
  await approveTx.wait();
  console.log(`Approval transaction confirmed.`);

  // 4. getApproved
  const approvedAddress = await contract.getApproved(tokenId);
  console.log(`getApproved(${tokenId}): ${approvedAddress}`);

  // 5. setApprovalForAll
  console.log(`\nSetting approval for all tokens for operator (${operatorAddress})...`);
  const setApprovalForAllTx = await contract.setApprovalForAll(operatorAddress, true);
  await setApprovalForAllTx.wait();

  // 6. isApprovedForAll
  const isApproved = await contract.isApprovedForAll(owner.address, operatorAddress);
  console.log(`isApprovedForAll(${owner.address}, ${operatorAddress}): ${isApproved}`);

  // 7. safeTransferFrom (we'll just send it to a random recipient address)
  console.log(`\nTransferring token #${tokenId} from ${owner.address} to ${recipientAddress} using safeTransferFrom...`);
  const safeTransferTx = await contract["safeTransferFrom(address,address,uint256)"](owner.address, recipientAddress, tokenId);
  await safeTransferTx.wait();

  tokenOwner = await contract.ownerOf(tokenId);
  console.log(`After safeTransferFrom, ownerOf(${tokenId}): ${tokenOwner}`);
  
  console.log(`\nAll core ERC-721 functions demonstrated successfully!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
