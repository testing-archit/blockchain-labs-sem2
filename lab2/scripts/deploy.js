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
  const [owner, addr1, addr2] = await ethers.getSigners();

  console.log("\n=== Transaction 1: Transfer 100 MHT (Owner -> Addr1) ===");
  console.log("From (Owner):", owner.address);
  console.log("To (Addr1):", addr1.address);
  const tx1 = await token.transfer(addr1.address, 100);
  const receipt1 = await tx1.wait();
  console.log("Tx Hash:", receipt1.hash);

  console.log("\n=== Transaction 2: Transfer 50 MHT (Addr1 -> Addr2) ===");
  console.log("From (Addr1):", addr1.address);
  console.log("To (Addr2):", addr2.address);
  const tx2 = await token.connect(addr1).transfer(addr2.address, 50);
  const receipt2 = await tx2.wait();
  console.log("Tx Hash:", receipt2.hash);

  // Final balances
  console.log("\n=== Final Balances ===");
  console.log("Deployer:", (await token.balanceOf(owner.address)).toString(), "MHT");
  console.log("Addr1:", (await token.balanceOf(addr1.address)).toString(), "MHT");
  console.log("Addr2:", (await token.balanceOf(addr2.address)).toString(), "MHT");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
