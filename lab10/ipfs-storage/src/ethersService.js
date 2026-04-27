import { ethers } from 'ethers';

// We pull this from .env to ensure the deployed contract address remains constant.
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0xE55A150cd74b97C3ea8F0619C3Ac42DE121Db518";

// Minimal ABI for IPFSStorage
export const CONTRACT_ABI = [
  "function storeFile(string memory _cid, string memory _name, bool _encrypted) public",
  "function getUserFiles() public view returns (tuple(string cid, string name, uint256 timestamp, bool encrypted)[])",
  "event FileStored(address indexed user, string cid, string name, bool encrypted)"
];

let provider;
let signer;
let contract;

export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed. Please install it to use blockchain features.");
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  
  contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  
  return { address: accounts[0], contract };
};

export const getContract = () => {
  if (!contract) throw new Error("Wallet not connected");
  return contract;
};

export const storeCidOnChain = async (cid, name, encrypted) => {
  try {
    const c = getContract();
    const tx = await c.storeFile(cid, name, encrypted);
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error("Blockchain error:", error);
    throw error;
  }
};

export const getFilesFromChain = async () => {
  try {
    const c = getContract();
    return await c.getUserFiles();
  } catch (error) {
    console.error("Blockchain error:", error);
    throw error;
  }
};
