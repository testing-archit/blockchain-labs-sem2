import { ethers } from 'ethers';
import { ABI, CONTRACT_ADDRESS, CHAIN_ID } from './contract.js';

// ── Wallet connection ────────────────────────────────────────────────────────
export async function connectWallet() {
  if (!window.ethereum) throw new Error('MetaMask not found. Please install it.');

  await window.ethereum.request({ method: 'eth_requestAccounts' });
  const provider = new ethers.BrowserProvider(window.ethereum);
  const network  = await provider.getNetwork();

  if (Number(network.chainId) !== CHAIN_ID) {
    // Try switching to Sepolia
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }],   // Sepolia
      });
    } catch (switchErr) {
      if (switchErr.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xaa36a7',
            chainName: 'Sepolia Testnet',
            nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://sepolia.infura.io/v3/86edeec464904ef0a823de6a7e32d37b'],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          }],
        });
      } else throw switchErr;
    }
  }

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const balance = await provider.getBalance(address);

  return {
    provider,
    signer,
    address,
    balanceEth: ethers.formatEther(balance),
  };
}

// ── Get a read-only contract (no wallet needed) ──────────────────────────────
export function getReadContract() {
  const provider = new ethers.JsonRpcProvider(
    'https://sepolia.infura.io/v3/86edeec464904ef0a823de6a7e32d37b'
  );
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
}

// ── Get a write contract (wallet needed) ─────────────────────────────────────
export function getWriteContract(signer) {
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
}

// ── Store a CID on-chain ─────────────────────────────────────────────────────
export async function storeCIDOnChain(signer, { cid, fileName, fileSize, encrypted }) {
  const contract = getWriteContract(signer);
  const tx = await contract.storeFile(cid, fileName, BigInt(fileSize || 0), encrypted);
  const receipt = await tx.wait();

  // Parse the FileStored event to get the on-chain ID
  const event = receipt.logs
    .map(log => { try { return contract.interface.parseLog(log); } catch { return null; } })
    .find(e => e?.name === 'FileStored');

  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    onChainId: event ? Number(event.args.id) : null,
  };
}

// ── Fetch all files stored by a user ─────────────────────────────────────────
export async function getUserFiles(address) {
  const contract = getReadContract();
  const raw = await contract.getUserFiles(address);
  return raw.map(normalizeRecord);
}

// ── Fetch recent files (global) ───────────────────────────────────────────────
export async function getRecentFiles(count = 20) {
  const contract = getReadContract();
  const total = Number(await contract.totalFiles());
  if (total === 0) return [];
  const from = total > count ? total - count : 0;
  const raw = await contract.getFiles(from, count);
  return raw.map(normalizeRecord).reverse();
}

// ── Fetch single file by on-chain ID ─────────────────────────────────────────
export async function getFileById(id) {
  const contract = getReadContract();
  const raw = await contract.getFile(id);
  return normalizeRecord(raw);
}

// ── Get total count ───────────────────────────────────────────────────────────
export async function getTotalFiles() {
  const contract = getReadContract();
  return Number(await contract.totalFiles());
}

// ── Helper: normalise BigInt fields ──────────────────────────────────────────
function normalizeRecord(r) {
  return {
    id:        Number(r.id),
    cid:       r.cid,
    fileName:  r.fileName,
    fileSize:  Number(r.fileSize),
    encrypted: r.encrypted,
    uploader:  r.uploader,
    timestamp: Number(r.timestamp),
  };
}
