const web3 = require("./connect");

const PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY || process.env.PRIVATE_KEY || "YOUR_PRIVATE_KEY";
if (!PRIVATE_KEY || PRIVATE_KEY === "YOUR_PRIVATE_KEY") {
  throw new Error("PRIVATE_KEY missing from environment variables");
}
const RECEIVER = "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE0"; // Replace with actual receiver address

(async () => {
  const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
  web3.eth.accounts.wallet.add(account);

  const tx = {
    from: account.address,
    to: RECEIVER,
    value: web3.utils.toWei("0.01", "ether"),
    gas: 21000
  };

  const receipt = await web3.eth.sendTransaction(tx);

  console.log("Transaction Hash:", receipt.transactionHash);
  console.log("Block Number:", receipt.blockNumber);
})();
