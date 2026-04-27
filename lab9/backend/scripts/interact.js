const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
        throw new Error("Please set CONTRACT_ADDRESS in .env");
    }

    console.log("==========================================");
    console.log("1. ATTACHING TO DEPLOYED CONTRACT...");
    const gameItems = await hre.ethers.getContractAt("GameItems", contractAddress);
    console.log("✅ Attached to contract at:", contractAddress);
    console.log("==========================================");

    const targetAddress = "0xf16095EEFBA8B88fe92180c1aca76B17ea68B101";

    // Token IDs based on contract constants
    const GOLD = 0;
    const SILVER = 1;
    const SWORD = 2;
    const SHIELD = 3;
    const CROWN = 4;

    console.log("\n2. MINTING INDIVIDUAL TOKENS...");
    // A. Calls mint: Mint GOLD, SILVER, SWORD
    let tx1 = await gameItems.mint(deployer.address, GOLD, 1000);
    await tx1.wait();
    console.log("✅ Minted 1000 GOLD. Tx:", tx1.hash);

    let tx2 = await gameItems.mint(deployer.address, SILVER, 500);
    await tx2.wait();
    console.log("✅ Minted 500 SILVER. Tx:", tx2.hash);

    let tx3 = await gameItems.mint(deployer.address, SWORD, 10);
    await tx3.wait();
    console.log("✅ Minted 10 SWORD. Tx:", tx3.hash);

    console.log("\n3. MINTING BATCH TOKENS...");
    // B. Calls mintBatch: Mint multiple tokens in one call
    let txBatchMint = await gameItems.mintBatch(
        deployer.address,
        [SHIELD, CROWN],
        [50, 5]
    );
    await txBatchMint.wait();
    console.log("✅ Minted batch (50 SHIELD, 5 CROWN). Tx:", txBatchMint.hash);

    console.log("\n4. TRANSFERRING TOKENS...");
    // C. Calls transfer functions: safeTransferFrom, safeBatchTransferFrom
    let txTransfer = await gameItems.safeTransferFrom(
        deployer.address,
        targetAddress,
        GOLD,
        100,
        "0x"
    );
    await txTransfer.wait();
    console.log(`✅ safeTransferFrom 100 GOLD to ${targetAddress}. Tx:`, txTransfer.hash);

    let txBatchTransfer = await gameItems.safeBatchTransferFrom(
        deployer.address,
        targetAddress,
        [SWORD, SHIELD],
        [2, 5],
        "0x"
    );
    await txBatchTransfer.wait();
    console.log(`✅ safeBatchTransferFrom (2 SWORD, 5 SHIELD) to ${targetAddress}. Tx:`, txBatchTransfer.hash);

    console.log("==========================================");
    console.log("✅ INTERACTION SCRIPT COMPLETE.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
