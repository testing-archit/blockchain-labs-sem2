const web3 = require("./connect");

const PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY || process.env.PRIVATE_KEY || "YOUR_PRIVATE_KEY";
if (!PRIVATE_KEY || PRIVATE_KEY === "YOUR_PRIVATE_KEY") {
  throw new Error("PRIVATE_KEY missing from environment variables");
}

// Helper function to print section headers
function printSection(taskNum, title) {
  console.log("\n" + "=".repeat(70));
  console.log(`TASK ${taskNum}: ${title}`);
  console.log("=".repeat(70) + "\n");
}

// Helper function to add delay between tasks
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  try {
    // ============================================
    // TASK 1: Connect to Ethereum Testnet
    // ============================================
    printSection(1, "Connect to Ethereum Testnet");
    console.log("📌 What this does:");
    console.log("   - Creates a Web3 provider that connects to Sepolia testnet");
    console.log("   - Uses Infura JSON-RPC endpoint");
    console.log("   - Allows us to query blockchain data\n");
    console.log("✅ Web3 provider successfully initialized");
    console.log("   Network: Sepolia Testnet");
    console.log("   Provider: Infura (https://sepolia.infura.io)\n");
    await delay(2000);

    // ============================================
    // TASK 2: Fetch Block Information
    // ============================================
    printSection(2, "Fetch Block Information");
    console.log("📌 What this does:");
    console.log("   - Gets the latest block from the blockchain");
    console.log("   - Shows block number, timestamp, validator, and transaction count");
    console.log("   - Fetches a specific block (5 blocks behind latest)\n");

    const latestBlock = await web3.eth.getBlock("latest");
    console.log("📊 Latest Block Information:");
    console.log("   Block Number:     ", latestBlock.number.toString());
    console.log("   Timestamp:        ", new Date(Number(latestBlock.timestamp) * 1000).toISOString());
    console.log("   Validator:        ", latestBlock.miner);
    console.log("   Transaction Count:", latestBlock.transactions.length, "transactions\n");

    const blockNumber = Number(latestBlock.number) - 5;
    const block = await web3.eth.getBlock(blockNumber);
    console.log(`📊 Block #${blockNumber} Transaction Hashes (first 5):`);
    block.transactions.slice(0, 5).forEach((tx, i) => {
      console.log(`   ${i + 1}. ${tx}`);
    });
    console.log(`   ... and ${block.transactions.length - 5} more\n`);
    await delay(2000);

    // ============================================
    // TASK 3: Network & Node Information
    // ============================================
    printSection(3, "Network & Node Information");
    console.log("📌 What this does:");
    console.log("   - Retrieves network metadata (Chain ID, Network ID)");
    console.log("   - Shows current node information");
    console.log("   - Verifies we're connected to Sepolia (Chain ID: 11155111)\n");

    const nodeInfo = await web3.eth.getNodeInfo();
    const networkId = await web3.eth.net.getId();
    const chainId = await web3.eth.getChainId();
    const currentBlock = await web3.eth.getBlockNumber();

    console.log("🔗 Network Information:");
    console.log("   Client Version:   ", nodeInfo);
    console.log("   Network ID:       ", networkId.toString());
    console.log("   Chain ID:         ", chainId.toString(), "(11155111 = Sepolia) ✓");
    console.log("   Current Block:    ", currentBlock.toString() + "\n");
    await delay(2000);

    // ============================================
    // TASK 4: Transaction Inspection
    // ============================================
    printSection(4, "Transaction Inspection");
    console.log("📌 What this does:");
    console.log("   - Fetches a real transaction from the latest block");
    console.log("   - Shows transaction details (from, to, value, gas)");
    console.log("   - Gets the transaction receipt (execution result)\n");

    const txHash = latestBlock.transactions[0];
    const tx = await web3.eth.getTransaction(txHash);
    const receipt = await web3.eth.getTransactionReceipt(txHash);

    console.log("💰 Transaction Details:");
    console.log("   Hash:             ", txHash);
    console.log("   From:             ", tx.from);
    console.log("   To:               ", tx.to);
    console.log("   Value (ETH):      ", web3.utils.fromWei(tx.value, "ether"), "ETH");
    console.log("   Gas Limit:        ", tx.gas.toString());
    console.log("   Gas Price:        ", web3.utils.fromWei(tx.gasPrice, "gwei"), "Gwei");
    console.log("   Nonce:            ", tx.nonce.toString());

    console.log("\n📋 Transaction Receipt (Execution Result):");
    console.log("   Status:           ", receipt.status === 1n ? "Success ✓" : "Failed ✗");
    console.log("   Gas Used:         ", receipt.gasUsed.toString());
    console.log("   Logs:             ", receipt.logs.length, "logs\n");
    await delay(2000);

    // ============================================
    // TASK 5: Account & Balance Analysis
    // ============================================
    printSection(5, "Account & Balance Analysis");
    console.log("📌 What this does:");
    console.log("   - Derives your wallet address from your private key");
    console.log("   - Fetches your account balance on Sepolia testnet");
    console.log("   - Shows your nonce (total outgoing transactions)\n");

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
    const address = account.address;
    const balanceWei = await web3.eth.getBalance(address);
    const balanceEth = web3.utils.fromWei(balanceWei, "ether");
    const nonce = await web3.eth.getTransactionCount(address);

    console.log("👛 Your Account:");
    console.log("   Address:          ", address);
    console.log("   Balance:          ", balanceEth, "ETH");
    console.log("   Transaction Count:", nonce.toString(), "(total transactions sent)\n");
    await delay(2000);

    // ============================================
    // TASK 6: Send a Real Testnet Transaction
    // ============================================
    printSection(6, "Send a Real Testnet Transaction");
    console.log("📌 What this does:");
    console.log("   - Signs and sends a real transaction on Sepolia testnet");
    console.log("   - Transfers 0.0001 ETH to another wallet");
    console.log("   - Shows transaction hash and confirmation\n");

    const RECEIVER = "0x320Cda63BDCe321e4A4735054a958E0b38380650";
    const sendAmount = "0.0001";
    const txObject = {
      from: address,
      to: RECEIVER,
      value: web3.utils.toWei(sendAmount, "ether"),
      gas: 21000,
      gasPrice: await web3.eth.getGasPrice()
    };

    console.log("📤 Transaction Configuration:");
    console.log("   From:             ", txObject.from);
    console.log("   To:               ", txObject.to);
    console.log("   Value:            ", sendAmount, "ETH");
    console.log("   Gas Limit:        ", txObject.gas.toString());
    console.log("   Gas Price:        ", web3.utils.fromWei(txObject.gasPrice, "gwei"), "Gwei");
    console.log("   Est. Gas Cost:    ", web3.utils.fromWei(BigInt(21000) * txObject.gasPrice, "ether"), "ETH\n");

    console.log("🔐 Signing and sending transaction...");
    const signedTx = await web3.eth.accounts.signTransaction(txObject, PRIVATE_KEY);
    const sentTx = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    console.log("\n✅ Transaction sent successfully!");
    console.log("   Transaction Hash: ", sentTx.transactionHash);
    console.log("   Block Number:     ", sentTx.blockNumber.toString());
    console.log("   Gas Used:         ", sentTx.gasUsed.toString());
    console.log("   Status:           ", sentTx.status === 1n ? "Success ✓" : "Failed ✗");
    console.log("\n🔗 View on Etherscan:");
    console.log(`   https://sepolia.etherscan.io/tx/${sentTx.transactionHash}\n`);
    await delay(2000);

    // ============================================
    // TASK 7: Event Subscription (Info Only)
    // ============================================
    printSection(7, "Event Subscription (Real-Time)");
    console.log("📌 What this does:");
    console.log("   - Subscribes to 'newBlockHeaders' events");
    console.log("   - Subscribes to 'pendingTransactions' events");
    console.log("   - Listens for new blocks & unconfirmed transactions\n");
    console.log("📡 Subscription Details:");
    console.log("   Event 1: newBlockHeaders");
    console.log("      → Triggered whenever a new block is mined");
    console.log("      → Shows block number in real-time");
    console.log("\n   Event 2: pendingTransactions");
    console.log("      → Triggered for unconfirmed transactions");
    console.log("      → Shows transaction hash\n");
    console.log("💡 To use: Run 'node subscribe.js' in a separate terminal");
    console.log("   This runs continuously until you press Ctrl+C\n");
    await delay(2000);

    // ============================================
    // TASK 8: Gas Price & Network Analysis
    // ============================================
    printSection(8, "Gas Price & Network Analysis");
    console.log("📌 What this does:");
    console.log("   - Gets current network gas price");
    console.log("   - Shows individual transaction gas prices");
    console.log("   - Helps understand network congestion\n");

    const gasPrice = await web3.eth.getGasPrice();
    const latestBlockFull = await web3.eth.getBlock("latest", true);

    console.log("⛽ Gas Price Analysis:");
    console.log("   Current Base Price:", web3.utils.fromWei(gasPrice, "gwei"), "Gwei\n");
    console.log("   Last 5 Transaction Gas Prices:");
    latestBlockFull.transactions.slice(0, 5).forEach((tx, i) => {
      const gwei = web3.utils.fromWei(tx.gasPrice, "gwei");
      console.log(`   ${i + 1}. ${gwei} Gwei`);
    });
    console.log("\n💡 Lower = cheaper, Higher = faster confirmation\n");
    await delay(2000);

    // ============================================
    // SUMMARY
    // ============================================
    printSection("Summary", "Complete Overview");
    console.log("✅ All 8 tasks completed successfully!\n");

    console.log("🔧 Your Account Summary:");
    console.log(`   Address:  ${address}`);
    console.log(`   Balance:  ${balanceEth} ETH`);
    console.log(`   Nonce:    ${nonce.toString()} (transactions sent)\n`);

    console.log("🚀 Next Steps:");
    console.log("   - Run individual task files: node blockInfo.js, node networkInfo.js, etc.");
    console.log("   - Modify receiver address in sendTx.js to send real transactions");
    console.log("   - Monitor live events with: node subscribe.js");
    console.log("   - Explore more complex smart contract interactions\n");

    console.log("=".repeat(70));
    console.log("Happy blockchain exploring! 🎉");
    console.log("=".repeat(70) + "\n");

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
})();
