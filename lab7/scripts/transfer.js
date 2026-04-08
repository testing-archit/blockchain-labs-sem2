const hre = require("hardhat");

async function main() {
  const tokenAddress = "0x8A33f21638173377B57eB3C7FAcbeDCb79a0Ab58";
  const recipient = "0xf16095EEFBA8B88fe92180c1aca76B17ea68B101";
  
  const ArchitToken = await hre.ethers.getContractFactory("ArchitToken");
  const token = ArchitToken.attach(tokenAddress);

  // Dynamically import the shared ERC20 functions ES module
  const { transferTokens } = await import("../frontend/src/utils/erc20_functions.js");

  const tx = await transferTokens(token, recipient, "100");

  await tx.wait();
  console.log("Transfer successful!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
