const web3 = require("./connect");

const PRIVATE_KEY = "0x93a0ab8a1035aa94b9640b278b5ff89abf56518734945a22b5f0520e9cf738b4";
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
