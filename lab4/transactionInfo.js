const web3 = require("./connect");

(async () => {
  const block = await web3.eth.getBlock("latest");
  const txHash = block.transactions[0];

  const tx = await web3.eth.getTransaction(txHash);
  const receipt = await web3.eth.getTransactionReceipt(txHash);

  console.log("From:", tx.from);
  console.log("To:", tx.to);
  console.log("Value (ETH):", web3.utils.fromWei(tx.value, "ether"));
  console.log("Gas:", tx.gas);
  console.log("Gas Price:", web3.utils.fromWei(tx.gasPrice, "gwei"), "Gwei");
  console.log("Nonce:", tx.nonce);

  console.log("\nReceipt Status:", receipt.status);
  console.log("Gas Used:", receipt.gasUsed);
  console.log("Logs:", receipt.logs);
})();
