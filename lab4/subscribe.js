const web3 = require("./connect");

console.log("📡 Starting blockchain event subscriptions...");
console.log("   Press Ctrl+C to stop\n");

(async () => {
  try {
    // Subscribe to new block headers
    const blockSubscription = await web3.eth.subscribe("newBlockHeaders");
    console.log("✅ Subscribed to newBlockHeaders");

    blockSubscription.on("data", (block) => {
      console.log(`🧱 New Block: #${block.number} | Hash: ${block.hash.slice(0, 18)}...`);
    });

    blockSubscription.on("error", (error) => {
      console.error("❌ Block subscription error:", error.message);
    });

    // Subscribe to pending transactions
    const pendingSubscription = await web3.eth.subscribe("pendingTransactions");
    console.log("✅ Subscribed to pendingTransactions\n");

    pendingSubscription.on("data", (txHash) => {
      console.log(`📤 Pending TX: ${txHash}`);
    });

    pendingSubscription.on("error", (error) => {
      console.error("❌ Pending TX subscription error:", error.message);
    });

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n\n🛑 Stopping subscriptions...");
      await blockSubscription.unsubscribe();
      await pendingSubscription.unsubscribe();
      console.log("👋 Goodbye!");
      process.exit(0);
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.log("\n💡 Note: WebSocket subscriptions require a WebSocket provider.");
    console.log("   HTTP providers (like Infura HTTP endpoint) don't support subscriptions.");
    console.log("   To use subscriptions, update connect.js to use a WebSocket URL:");
    console.log("   wss://sepolia.infura.io/ws/v3/YOUR_PROJECT_ID\n");
    process.exit(1);
  }
})();
