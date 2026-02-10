const hre = require("hardhat");
const fs = require("fs");
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (q) => new Promise((res) => rl.question(q, res));

async function main() {
    if (!fs.existsSync("deployed-address.txt")) {
        throw new Error("No deployed contract found. Run deploy.js first.");
    }

    const contractAddress = fs.readFileSync("deployed-address.txt", "utf8").trim();
    console.log("📍 Using SecureVault at:", contractAddress);

    const [user] = await hre.ethers.getSigners();
    console.log("👤 Account:", user.address);

    const SecureVault = await hre.ethers.getContractFactory("SecureVault");
    const vault = SecureVault.attach(contractAddress);

    // -------- CURRENT VAULT BALANCE --------
    let vaultBalance = await vault.getBalance(user.address);
    console.log(
        "📊 Current vault balance:",
        hre.ethers.formatEther(vaultBalance),
        "ETH\n"
    );

    // -------- DEPOSIT --------
    const depositInput = await ask("Enter ETH amount to DEPOSIT: ");
    const depositAmount = hre.ethers.parseEther(depositInput);

    console.log("📥 Depositing", depositInput, "ETH...");
    const depositTx = await vault.deposit({ value: depositAmount });
    await depositTx.wait(2);
    console.log("✅ Deposit confirmed:", depositTx.hash);

    vaultBalance = await vault.getBalance(user.address);
    console.log(
        "📊 Updated vault balance:",
        hre.ethers.formatEther(vaultBalance),
        "ETH\n"
    );

    // -------- WITHDRAW --------
    const withdrawInput = await ask("Enter ETH amount to WITHDRAW: ");
    const withdrawAmount = hre.ethers.parseEther(withdrawInput);

    // 🔴 HARD CHECK (IMPORTANT)
    if (withdrawAmount > vaultBalance) {
        throw new Error(
            `Withdrawal blocked: requested ${withdrawInput} ETH but vault has only ${hre.ethers.formatEther(
                vaultBalance
            )} ETH`
        );
    }

    console.log("📤 Withdrawing", withdrawInput, "ETH...");
    const withdrawTx = await vault.withdraw(withdrawAmount);
    await withdrawTx.wait(2);
    console.log("✅ Withdrawal confirmed:", withdrawTx.hash);

    vaultBalance = await vault.getBalance(user.address);
    console.log(
        "📊 Final vault balance:",
        hre.ethers.formatEther(vaultBalance),
        "ETH"
    );

    rl.close();
}

main().catch((err) => {
    console.error("❌ ERROR:", err.message);
    rl.close();
    process.exit(1);
});
