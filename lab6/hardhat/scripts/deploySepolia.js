const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const UniversityCredentials = await hre.ethers.getContractFactory("UniversityCredentials");
    const credential = await UniversityCredentials.deploy();

    await credential.waitForDeployment();
    const address = await credential.getAddress();

    console.log("UniversityCredentials contract deployed to:", address);

    // Save address and ABI to frontend
    const frontendDir = path.join(__dirname, "../../frontend/src");
    if (!fs.existsSync(frontendDir)) {
        fs.mkdirSync(frontendDir, { recursive: true });
    }

    const configPath = path.join(frontendDir, "config.json");
    const abiPath = path.join(frontendDir, "Credential.json");

    fs.writeFileSync(configPath, JSON.stringify({ contractAddress: address }, null, 2));

    const artifact = artifacts.readArtifactSync("UniversityCredentials");
    fs.writeFileSync(abiPath, JSON.stringify(artifact, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
