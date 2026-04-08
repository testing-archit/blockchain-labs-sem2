async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy the Token contract
  const token = await ethers.deployContract("Token");
  await token.waitForDeployment();

  const tokenAddress = await token.getAddress();
  console.log("\n=== Deployment ===");
  console.log("Token deployed at:", tokenAddress);
  console.log("Etherscan: https://sepolia.etherscan.io/address/" + tokenAddress);

  // Show deployer's initial balance
  const totalSupply = await token.totalSupply();
  console.log("\nTotal Supply:", totalSupply.toString(), "MHT");
  console.log("Deployer balance:", (await token.balanceOf(deployer.address)).toString(), "MHT");

  // --- Perform Token Transfers (Transactions) ---
  // Generate two random addresses to send tokens to
  const wallet1 = ethers.Wallet.createRandom();
  const wallet2 = ethers.Wallet.createRandom();

  console.log("\n=== Transaction 1: Transfer 100 MHT ===");
  console.log("To:", wallet1.address);
  const tx1 = await token.transfer(wallet1.address, 100);
  const receipt1 = await tx1.wait();
  console.log("Tx Hash:", receipt1.hash);
  console.log("Etherscan: https://sepolia.etherscan.io/tx/" + receipt1.hash);

  console.log("\n=== Transaction 2: Transfer 200 MHT ===");
  console.log("To:", wallet2.address);
  const tx2 = await token.transfer(wallet2.address, 200);
  const receipt2 = await tx2.wait();
  console.log("Tx Hash:", receipt2.hash);
  console.log("Etherscan: https://sepolia.etherscan.io/tx/" + receipt2.hash);

  // Final balances
  console.log("\n=== Final Balances ===");
  console.log("Deployer:", (await token.balanceOf(deployer.address)).toString(), "MHT");
  console.log("Wallet 1:", (await token.balanceOf(wallet1.address)).toString(), "MHT");
  console.log("Wallet 2:", (await token.balanceOf(wallet2.address)).toString(), "MHT");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
