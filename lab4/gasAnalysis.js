const web3 = require("./connect");

(async () => {
  const gasPrice = await web3.eth.getGasPrice();
  console.log("Current Gas Price:", web3.utils.fromWei(gasPrice, "gwei"), "Gwei");

  const block = await web3.eth.getBlock("latest", true);

  block.transactions.slice(0, 5).forEach(tx => {
    console.log(
      "TX Gas Price:",
      web3.utils.fromWei(tx.gasPrice, "gwei"),
      "Gwei"
    );
  });
})();
