const web3 = require("./connect");

const PRIVATE_KEY = "0x93a0ab8a1035aa94b9640b278b5ff89abf56518734945a22b5f0520e9cf738b4";
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
