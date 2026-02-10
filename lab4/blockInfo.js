const web3 = require("./connect");

(async () => {
  const latestBlock = await web3.eth.getBlock("latest");

  console.log("Latest Block Number:", latestBlock.number);
  console.log("Timestamp:", latestBlock.timestamp);
  console.log("Validator:", latestBlock.miner);
  console.log("Transaction Count:", latestBlock.transactions.length);

  // Fetch a specific block
  const blockNumber = Number(latestBlock.number) - 5;
  const block = await web3.eth.getBlock(blockNumber);

  console.log(`\nTransactions in block ${blockNumber}:`);
  block.transactions.forEach(tx => console.log(tx));
})();
