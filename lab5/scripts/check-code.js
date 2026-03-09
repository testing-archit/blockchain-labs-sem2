
async function main() {
    const address = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
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
