import { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Local hardhat token address
const CONTRACT_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) external"
];

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("0");
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [network, setNetwork] = useState("");
  
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (window.ethereum) {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);
    } else {
      console.error("MetaMask not found!");
    }
  }, []);

  const connectWallet = async () => {
    if (!provider) {
      alert("Please install MetaMask!");
      return;
    }
    try {
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      const web3Signer = await provider.getSigner();
      setSigner(web3Signer);
      fetchTokenDetails(web3Signer, accounts[0]);
    } catch (err) {
      console.error(err);
      setStatusMessage("Failed to connect wallet.");
    }
  };

  const fetchTokenDetails = async (currentSigner, userAddress) => {
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, currentSigner);
      const name = await contract.name();
      const symbol = await contract.symbol();
      const userBalance = await contract.balanceOf(userAddress);
      
      const net = await provider.getNetwork();
      setNetwork(net.name === "unknown" ? `Chain ID: ${net.chainId.toString()}` : net.name);

      setTokenName(name);
      setTokenSymbol(symbol);
      setBalance(userBalance.toString());
    } catch (err) {
      console.error("Error fetching token details:", err);
      setStatusMessage("Error: Could not fetch token details. Check your network and contract address.");
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!signer) return;

    setIsProcessing(true);
    setStatusMessage("Processing transaction...");
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.transfer(transferTo, transferAmount);
      setStatusMessage("Waiting for confirmation...");
      await tx.wait();
      setStatusMessage(`Successfully transferred ${transferAmount} ${tokenSymbol} to ${transferTo.slice(0, 6)}...${transferTo.slice(-4)}`);
      
      // Refresh balance
      fetchTokenDetails(signer, account);
      setTransferTo("");
      setTransferAmount("");
    } catch (err) {
      console.error(err);
      setStatusMessage("Transaction failed. Check console for details.");
    }
    setIsProcessing(false);
  };

  return (
    <div className="app-container">
      <div className="glass-panel">
        <header className="header">
          <h1>{tokenName || "Hardhat Token"}</h1>
          <p className="subtitle">Decentralized Token Management</p>
        </header>

        {!account ? (
          <div className="connect-section">
            <div className="wallet-animation">
              <div className="circle"></div>
              <div className="circle"></div>
              <div className="circle"></div>
            </div>
            <button className="btn primary-btn pulse-btn" onClick={connectWallet}>
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="dashboard">
            <div className="wallet-info card-glass">
              <div className="label">Connected Wallet</div>
              <div className="value truncate">{account}</div>
              <div className="balance-box">
                <div className="balance-label">Your Balance</div>
                <div className="balance-value">{balance} <span className="symbol">{tokenSymbol}</span></div>
              </div>
              <div className="network-info">
                Connected to: <span className="network-name">{network}</span>
              </div>
            </div>

            <form className="transfer-form card-glass" onSubmit={handleTransfer}>
              <h2>Transfer Tokens</h2>
              
              <div className="input-group">
                <label>Recipient Address</label>
                <input 
                  type="text" 
                  placeholder="0x..." 
                  value={transferTo} 
                  onChange={(e) => setTransferTo(e.target.value)} 
                  required 
                />
              </div>
              
              <div className="input-group">
                <label>Amount</label>
                <input 
                  type="number" 
                  placeholder="0" 
                  value={transferAmount} 
                  onChange={(e) => setTransferAmount(e.target.value)} 
                  required 
                  min="1"
                />
              </div>

              <button 
                type="submit" 
                className={`btn primary-btn transfer-btn ${isProcessing ? 'loading' : ''}`} 
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Send Tokens"}
              </button>
            </form>

            {statusMessage && (
              <div className={`status-message ${statusMessage.includes('failed') ? 'error' : 'success'}`}>
                {statusMessage}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
      </div>
    </div>
  );
}

export default App;
