require("@nomicfoundation/hardhat-toolbox");

const INFURA_API_KEY = process.env.INFURA_API_KEY || "YOUR_INFURA_API_KEY";
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY || "YOUR_SEPOLIA_PRIVATE_KEY";

module.exports = {
  solidity: "0.8.23",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: SEPOLIA_PRIVATE_KEY !== "YOUR_SEPOLIA_PRIVATE_KEY" && SEPOLIA_PRIVATE_KEY.length === 64 ? [SEPOLIA_PRIVATE_KEY] : [],
      timeout: 120000,
      httpHeaders: {
        "Connection": "keep-alive"
      }
    },
  },
};
