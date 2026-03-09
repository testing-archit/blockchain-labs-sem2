
async function main() {
    const address = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
    const Storage = await ethers.getContractFactory("Storage");
    const storage = Storage.attach(address);

    try {
        const owner = await storage.owner();
        console.log("Contract Address:", address);
        console.log("Verified Owner:", owner);
    } catch (error) {
        console.error("Error reading owner:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
