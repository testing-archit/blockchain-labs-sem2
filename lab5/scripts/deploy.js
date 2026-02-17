import hre from "hardhat";

async function main() {
    const Storage = await hre.ethers.getContractFactory("Storage");
    const storage = await Storage.deploy();
    await storage.waitForDeployment();

    const address = await storage.getAddress();
    console.log("Storage deployed to:", address);

    // Update frontend contract address and ABI
    const fs = await import("fs");
    const path = await import("path");
    const contractPath = path.join(process.cwd(), "frontend", "src", "contract.js");

    const artifactPath = path.join(process.cwd(), "artifacts", "contracts", "Storage.sol", "Storage.json");
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    const content = `// Contract ABI and deployed address helper
// After deploying, update CONTRACT_ADDRESS with the actual address

export const CONTRACT_ADDRESS = "${address}";

export const CONTRACT_ABI = ${JSON.stringify(artifact.abi, null, 4)};
`;

    fs.writeFileSync(contractPath, content);
    console.log("Frontend contract address and ABI updated.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
