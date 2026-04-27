const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("==========================================");
    console.log("Deploying contracts with the account:", deployer.address);

    const GameItems = await hre.ethers.getContractFactory("GameItems");
    const gameItems = await GameItems.deploy();
    
    await gameItems.waitForDeployment();
    const address = await gameItems.getAddress();

    console.log("✅ GameItems contract successfully deployed!");
    console.log("📄 Contract Address:", address);
    console.log("==========================================");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
