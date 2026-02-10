const hre = require("hardhat");

async function main() {
    const vaultAddress = "0x65902CD579efb4D9b947295534BfBfA06492427b";

    const [signer] = await hre.ethers.getSigners();
    const Vault = await hre.ethers.getContractFactory("SecureVault");
    const vault = Vault.attach(vaultAddress);

    const balance = await vault.getBalance(signer.address);
    console.log("Vault balance:", hre.ethers.formatEther(balance));

    if (balance === 0n) {
        console.log("⚠️ Vault balance already zero. Nothing to withdraw.");
        return;
    }

    try {
        const tx = await vault.withdraw(balance);
        await tx.wait();
        console.log("✅ Withdrawn all remaining ETH");
    } catch (err) {
        console.error("❌ Withdrawal failed");
        console.error(err.reason || err.message);
    }
}

main().catch((err) => {
    console.error("❌ Script crashed:", err);
});
