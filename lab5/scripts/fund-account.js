
async function main() {
    const [deployer] = await ethers.getSigners();
    const recipient = "0xc8446ADb14Ad0684A31CeF01CA3127EB4Ac17C02";
    const amount = ethers.parseEther("10.0");

    console.log("Sending 10 ETH from", deployer.address, "to", recipient);

    const tx = await deployer.sendTransaction({
        to: recipient,
        value: amount
    });

    await tx.wait();
    console.log("Transaction confirmed:", tx.hash);

    const balance = await ethers.provider.getBalance(recipient);
    console.log("New Balance:", ethers.formatEther(balance), "ETH");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
