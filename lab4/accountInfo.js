const web3 = require("./connect");

const PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY || process.env.PRIVATE_KEY || "YOUR_PRIVATE_KEY";
if (!PRIVATE_KEY || PRIVATE_KEY === "YOUR_PRIVATE_KEY") {
  throw new Error("PRIVATE_KEY missing from environment variables");
}
const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
const address = account.address;

(async () => {
  const balanceWei = await web3.eth.getBalance(address);
  const balanceEth = web3.utils.fromWei(balanceWei, "ether");

  const nonce = await web3.eth.getTransactionCount(address);

  console.log("Address:", address);
  console.log("Balance:", balanceEth, "ETH");
  console.log("Transaction Count (Nonce):", nonce);
})();
