const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) throw new Error("Set CONTRACT_ADDRESS in .env first (run deploy.js)");

  console.log("==========================================");
  console.log("Attaching to GameItems at:", contractAddress);
  const gameItems = await hre.ethers.getContractAt("GameItems", contractAddress);

  const TARGET = "0xf16095EEFBA8B88fe92180c1aca76B17ea68B101";

  // Token IDs
  const GOLD = 0, SILVER = 1, SWORD = 2, SHIELD = 3, CROWN = 4;

  // ── 1. mint() – individual mints ──────────────────────────
  console.log("\n[1] mint() – individual tokens");
  let tx1 = await gameItems.mint(deployer.address, GOLD,   1000);
  await tx1.wait();
  console.log(`  ✅ Minted 1000 GOLD   | tx: ${tx1.hash}`);

  let tx2 = await gameItems.mint(deployer.address, SILVER,  500);
  await tx2.wait();
  console.log(`  ✅ Minted  500 SILVER | tx: ${tx2.hash}`);

  let tx3 = await gameItems.mint(deployer.address, SWORD,   10);
  await tx3.wait();
  console.log(`  ✅ Minted   10 SWORD  | tx: ${tx3.hash}`);

  // ── 2. mintBatch() ────────────────────────────────────────
  console.log("\n[2] mintBatch() – batch mint");
  let txB = await gameItems.mintBatch(
    deployer.address,
    [SHIELD, CROWN],
    [50, 5]
  );
  await txB.wait();
  console.log(`  ✅ Batch minted 50 SHIELD + 5 CROWN | tx: ${txB.hash}`);

  // ── 3. safeTransferFrom() ─────────────────────────────────
  console.log("\n[3] safeTransferFrom() – single transfer to target");
  let txT = await gameItems.safeTransferFrom(
    deployer.address, TARGET, GOLD, 100, "0x"
  );
  await txT.wait();
  console.log(`  ✅ Transferred 100 GOLD → ${TARGET} | tx: ${txT.hash}`);

  // ── 4. safeBatchTransferFrom() ────────────────────────────
  console.log("\n[4] safeBatchTransferFrom() – batch transfer to target");
  let txBT = await gameItems.safeBatchTransferFrom(
    deployer.address, TARGET,
    [SWORD, SHIELD],
    [2,     5],
    "0x"
  );
  await txBT.wait();
  console.log(`  ✅ Batch transferred 2 SWORD + 5 SHIELD → ${TARGET} | tx: ${txBT.hash}`);

  console.log("\n==========================================");
  console.log("✅ All interactions complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => { console.error(error); process.exit(1); });
