const { Web3 } = require("web3");

try {
  require("dotenv").config();
} catch (e) {}

const INFURA_API_KEY = process.env.INFURA_API_KEY || "YOUR_INFURA_API_KEY";

if (!INFURA_API_KEY || INFURA_API_KEY === "YOUR_INFURA_API_KEY") {
  throw new Error("INFURA_API_KEY missing from environment variables");
}

// Use WebSocket for subscriptions support
const web3 = new Web3(
  `wss://sepolia.infura.io/ws/v3/${INFURA_API_KEY}`
);

module.exports = web3;
