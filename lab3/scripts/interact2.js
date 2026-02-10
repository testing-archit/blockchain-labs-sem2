const hre = require("hardhat");
const fs = require("fs");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
    if (!fs.existsSync("deployed-address.txt")) {
        console.error("❌ No deployed contract found! Run deploy.js first.");
        process.exit(1);
    }

    const contractAddress = fs.readFileSync("deployed-address.txt", "utf8").trim();
    console.log("📍 Using SecureVault at:", contractAddress);

    const [deployer] = await hre.ethers.getSigners();
    console.log("👤 Using account:", deployer.address);
    console.log(
        "💰 Account balance:",
        hre.ethers.formatEther(
            await hre.ethers.provider.getBalance(deployer.address)
        ),
        "ETH\n"
    );

    const SecureVault = await hre.ethers.getContractFactory("SecureVault");
    const vault = SecureVault.attach(contractAddress);

    // ------------------ INITIAL BALANCE ------------------
    let vaultBalance = await vault.getBalance(deployer.address);
    console.log(
        "📊 Initial vault balance:",
        hre.ethers.formatEther(vaultBalance),
        "ETH"
    );

    // ------------------ DEPOSIT ------------------
    const depositAmount = hre.ethers.parseEther("0.05");
    console.log(
        "\n📥 Depositing",
        hre.ethers.formatEther(depositAmount),
        "ETH..."
    );

    try {
        const depositTx = await vault.deposit({ value: depositAmount });
        console.log("⏳ Waiting for deposit confirmation...");
        await depositTx.wait(2);

        console.log("✅ Deposit successful!");
        console.log("   Tx hash:", depositTx.hash);
    } catch (err) {
        console.error("❌ Deposit failed due to network/RPC issue");
        console.error(err.reason || err.message);
        return;
    }

    vaultBalance = await vault.getBalance(deployer.address);
    console.log(
        "   Vault balance:",
        hre.ethers.formatEther(vaultBalance),
        "ETH\n"
    );

    await sleep(5000); // prevent RPC overload

    // ------------------ SUCCESSFUL WITHDRAW ------------------
    const withdrawAmount = hre.ethers.parseEther("0.02");
    console.log(
        "📤 Withdrawing",
        hre.ethers.formatEther(withdrawAmount),
        "ETH..."
    );

    try {
        const withdrawTx = await vault.withdraw(withdrawAmount);
        console.log("⏳ Waiting for withdrawal confirmation...");
        await withdrawTx.wait(2);

        console.log("✅ Withdrawal successful!");
        console.log("   Tx hash:", withdrawTx.hash);
    } catch (err) {
        console.error("⚠️ Withdrawal failed (network/RPC)");
        console.error(err.reason || err.message);
        return;
    }

    vaultBalance = await vault.getBalance(deployer.address);
    console.log(
        "   Vault balance:",
        hre.ethers.formatEther(vaultBalance),
        "ETH\n"
    );

    await sleep(5000);

    // ------------------ FAILING WITHDRAW ------------------
    const failingAmount = hre.ethers.parseEther("1");
    console.log(
        "🚫 Attempting failing withdrawal of",
        hre.ethers.formatEther(failingAmount),
        "ETH..."
    );

    try {
        const failTx = await vault.withdraw(failingAmount);
        await failTx.wait(2);

        console.log("❌ ERROR: Withdrawal should have failed but succeeded!");
    } catch (err) {
        console.log("✅ Withdrawal failed as expected");

        if (err.reason) {
            console.log("   Revert reason:", err.reason);
        } else {
            console.log("   Error:", err.message.split("\n")[0]);
        }
    }

    console.log("\n-------------------------------------------");
    console.log("🎉 Interaction script completed safely");
}

main().catch((error) => {
    console.error("❌ Script crashed unexpectedly:", error);
    process.exitCode = 1;
});
