const { Web3 } = require("web3");

// ⚠️ Rotate this key if it was ever shared
const INFURA_API_KEY = "86edeec464904ef0a823de6a7e32d37b";

if (!INFURA_API_KEY) {
  throw new Error("INFURA_API_KEY missing");
}

// Use WebSocket for subscriptions support
const web3 = new Web3(
  `wss://sepolia.infura.io/ws/v3/${INFURA_API_KEY}`
);

module.exports = web3;
