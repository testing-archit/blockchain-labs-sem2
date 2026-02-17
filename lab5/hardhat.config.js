import "dotenv/config";
import "@nomicfoundation/hardhat-ethers";

/** @type import('hardhat/config').HardhatUserConfig */
export default {
    solidity: "0.8.20",
    networks: {
        localhost: {
            url: "http://127.0.0.1:8545",
        },
        sepolia: {
            url: process.env.SEPOLIA_URL || "",
            accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 66 ? [process.env.PRIVATE_KEY] : [],
        },
    },
};
