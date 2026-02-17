
async function main() {
    const address = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const code = await ethers.provider.getCode(address);
    console.log("Code at address:", address);
    console.log("Code length:", code.length);
    if (code.length <= 2) {
        console.log("NO CODE FOUND (Contract not deployed or address wrong)");
    } else {
        console.log("CODE FOUND!");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
