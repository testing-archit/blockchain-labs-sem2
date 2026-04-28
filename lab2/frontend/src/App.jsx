import { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const CONTRACT_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("0");
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [network, setNetwork] = useState("");
  const [decimals, setDecimals] = useState(18);
  
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [statusMessage, setStatusMessage] = useState(null); 
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [checkBalanceAddr, setCheckBalanceAddr] = useState("");
  const [checkedBalance, setCheckedBalance] = useState(null);

  const [transactions, setTransactions] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (window.ethereum) {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);

      const handleAccountsChanged = async (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const newSigner = await web3Provider.getSigner();
          setSigner(newSigner);
          fetchTokenDetails(newSigner, accounts[0], web3Provider);
        } else {
          disconnect();
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    }
  }, []);

  const disconnect = () => {
    setAccount("");
    setBalance("0");
    setSigner(null);
    setTransactions([]);
  };

  const connectWallet = async () => {
    if (!provider) {
      alert("Please install MetaMask!");
      return;
    }
    try {
      await provider.send("wallet_requestPermissions", [{ eth_accounts: {} }]);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      const web3Signer = await provider.getSigner();
      setSigner(web3Signer);
      fetchTokenDetails(web3Signer, accounts[0]);
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: "Connection failed or rejected." });
    }
  };

  const fetchTokenDetails = async (currentSigner, userAddress, currentProvider = provider) => {
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, currentSigner);
      const name = await contract.name();
      const symbol = await contract.symbol();
      const decs = await contract.decimals();
      const userBalance = await contract.balanceOf(userAddress);
      
      const net = await currentProvider.getNetwork();
      setNetwork(net.name === "unknown" ? `Chain ID: ${net.chainId.toString()}` : net.name);

      setTokenName(name);
      setTokenSymbol(symbol);
      setDecimals(decs);
      setBalance(ethers.formatUnits(userBalance, decs));

      loadTransactionHistory(contract, decs);
    } catch (err) {
      console.error("Error fetching details:", err);
      setStatusMessage({ type: 'error', text: "Network error. Make sure you are on Sepolia." });
    }
  };

  const loadTransactionHistory = async (contract, decs) => {
    setIsLoadingHistory(true);
    try {
      const filter = contract.filters.Transfer();
      const events = await contract.queryFilter(filter, -10000, "latest"); 
      
      const formattedTxs = events.map(event => {
        const amt = parseFloat(ethers.formatUnits(event.args[2], decs));
        return {
          hash: event.transactionHash,
          from: event.args[0],
          to: event.args[1],
          amount: amt < 0.0001 ? "< 0.0001" : amt.toLocaleString(undefined, { maximumFractionDigits: 4 })
        };
      }).reverse().slice(0, 50); 

      setTransactions(formattedTxs);
    } catch (err) {
      console.error("Error loading history:", err);
    }
    setIsLoadingHistory(false);
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!signer) return;

    setIsProcessing(true);
    setStatusMessage({ type: 'info', text: "Awaiting wallet confirmation..." });
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const amountParsed = ethers.parseUnits(transferAmount, decimals);
      const tx = await contract.transfer(transferTo, amountParsed);
      
      setStatusMessage({ type: 'info', text: "Transaction submitted. Waiting for confirmation..." });
      await tx.wait();
      
      setStatusMessage({ 
        type: 'success', 
        text: `Transferred ${transferAmount} ${tokenSymbol} successfully!`,
        link: tx.hash
      });
      
      fetchTokenDetails(signer, account);
      setTransferTo("");
      setTransferAmount("");
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.reason || "Transaction failed." });
    }
    setIsProcessing(false);
  };

  const handleCheckBalance = async (e) => {
    e.preventDefault();
    if (!signer) return;
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const bal = await contract.balanceOf(checkBalanceAddr);
      const formatted = parseFloat(ethers.formatUnits(bal, decimals)).toLocaleString(undefined, { maximumFractionDigits: 4 });
      setCheckedBalance(formatted);
    } catch (err) {
      setCheckedBalance("Invalid Address");
    }
  };

  const formatBalance = (bal) => {
    return parseFloat(bal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  const truncateAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="app-container">
      {/* Dynamic Background Elements */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      
      <header className="header">
        <div className="header-badge">{network || "Testnet"}</div>
        <h1>{tokenName || "Hardhat Token"}</h1>
        <p className="subtitle">Seamless Decentralized Asset Transfers</p>
      </header>

      {!account ? (
        <div className="connect-wrapper">
          <div className="connect-card glass">
            <div className="icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="wallet-icon"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a8 8 0 0 1-8 8H5a2 2 0 0 1-2-2V8"/><path d="M22 12h-4v4h4v-4Z"/></svg>
            </div>
            <h2>Connect Your Wallet</h2>
            <p>Link your MetaMask to interact with the blockchain securely.</p>
            <button className="btn btn-primary btn-large glow-effect" onClick={connectWallet}>
              Connect MetaMask
            </button>
            {statusMessage && <div className={`alert alert-${statusMessage.type}`}>{statusMessage.text}</div>}
          </div>
        </div>
      ) : (
        <main className="dashboard">
          
          <div className="top-widgets">
            {/* Wallet Card */}
            <div className="widget glass wallet-widget">
              <div className="widget-header">
                <h3>My Wallet</h3>
                <span className="network-pill">{network}</span>
              </div>
              <div className="wallet-address-box">
                <span className="address">{account}</span>
              </div>
              
              <div className="balance-section">
                <span className="balance-label">Available Balance</span>
                <div className="balance-value">
                  <span className="amount">{formatBalance(balance)}</span>
                  <span className="currency">{tokenSymbol}</span>
                </div>
              </div>
              
              <div className="action-buttons">
                <button className="btn btn-secondary" onClick={connectWallet}>Switch Account</button>
                <button className="btn btn-danger" onClick={disconnect}>Disconnect</button>
              </div>
            </div>

            {/* Transfer Card */}
            <div className="widget glass transfer-widget">
              <div className="widget-header">
                <h3>Send Tokens</h3>
              </div>
              <form onSubmit={handleTransfer} className="transfer-form">
                <div className="input-group">
                  <label>Recipient Address</label>
                  <div className="input-wrapper">
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="0x..." 
                      value={transferTo} 
                      onChange={(e) => setTransferTo(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="input-group">
                  <label>Amount</label>
                  <div className="input-wrapper amount-wrapper">
                    <input 
                      type="number" 
                      className="form-control"
                      placeholder="0.00" 
                      step="any"
                      value={transferAmount} 
                      onChange={(e) => setTransferAmount(e.target.value)} 
                      required 
                      min="0.000001"
                    />
                    <span className="currency-suffix">{tokenSymbol}</span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className={`btn btn-primary btn-submit ${isProcessing ? 'processing' : ''}`}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing Transfer..." : "Confirm Transfer"}
                </button>
              </form>

              {statusMessage && (
                <div className={`alert alert-${statusMessage.type}`}>
                  <p>{statusMessage.text}</p>
                  {statusMessage.link && (
                    <a href={`https://sepolia.etherscan.io/tx/${statusMessage.link}`} target="_blank" rel="noopener noreferrer" className="tx-link">
                      View Transaction on Etherscan →
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bottom-widgets">
            {/* Checker Card */}
            <div className="widget glass checker-widget">
              <div className="widget-header">
                <h3>Explorer Tool</h3>
              </div>
              <p className="helper-text">Lookup the token balance of any address on the network.</p>
              <form onSubmit={handleCheckBalance} className="checker-form">
                <div className="search-bar">
                  <input 
                    type="text" 
                    placeholder="Enter wallet address..." 
                    value={checkBalanceAddr} 
                    onChange={(e) => { setCheckBalanceAddr(e.target.value); setCheckedBalance(null); }} 
                    required 
                  />
                  <button type="submit" className="btn btn-secondary">Search</button>
                </div>
              </form>
              {checkedBalance !== null && (
                <div className="checker-result">
                  <div className="result-label">Balance Found:</div>
                  <div className="result-value">{checkedBalance} <span>{tokenSymbol}</span></div>
                </div>
              )}
            </div>

            {/* History Card */}
            <div className="widget glass history-widget">
              <div className="widget-header">
                <h3>Recent Transactions</h3>
                {isLoadingHistory && <span className="loader">Syncing...</span>}
              </div>
              
              <div className="table-responsive">
                {transactions.length === 0 && !isLoadingHistory ? (
                  <div className="no-data">No recent transfers found.</div>
                ) : (
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Amount</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Tx Hash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx, idx) => (
                        <tr key={idx}>
                          <td><span className="status-badge success">Confirmed</span></td>
                          <td className="font-mono highlight">+{tx.amount}</td>
                          <td className="font-mono">{truncateAddress(tx.from)}</td>
                          <td className="font-mono">{truncateAddress(tx.to)}</td>
                          <td>
                            <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="hash-link">
                              {truncateAddress(tx.hash)} ↗
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
          
        </main>
      )}
    </div>
  );
}

export default App;
