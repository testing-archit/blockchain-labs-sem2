require("@nomicfoundation/hardhat-toolbox");

const INFURA_API_KEY = "86edeec464904ef0a823de6a7e32d37b";
const SEPOLIA_PRIVATE_KEY = "93a0ab8a1035aa94b9640b278b5ff89abf56518734945a22b5f0520e9cf738b4";

module.exports = {
  solidity: "0.8.23",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY],
    },
  },
};
