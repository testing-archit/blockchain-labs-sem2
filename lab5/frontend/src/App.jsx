import { useState, useEffect, useCallback } from "react";
import Web3 from "web3";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./contract";
import "./App.css";

// Floating particles component
function Particles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: `${2 + Math.random() * 4}px`,
    delay: `${-Math.random() * 6}s`,
  }));

  return (
    <div className="particles">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

function App() {
  // --- State ---
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");
  const [contractOwner, setContractOwner] = useState("");
  const [storedValue, setStoredValue] = useState("—");
  const [newValue, setNewValue] = useState("");
  const [newOwnerAddr, setNewOwnerAddr] = useState("");
  const [txHash, setTxHash] = useState("");
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessUser, setAccessUser] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);

  const isOwner =
    account &&
    contractOwner &&
    account.toLowerCase() === contractOwner.toLowerCase();

  // --- Connect MetaMask ---
  const connectWallet = useCallback(async () => {
    let provider = window.ethereum;

    if (!provider) {
      setError("MetaMask is not installed. Please install it to use this DApp.");
      return;
    }

    // Handle multiple wallets (find specifically MetaMask)
    if (provider.providers) {
      const metaMaskProvider = provider.providers.find((p) => p.isMetaMask && !p.isPhantom);
      if (metaMaskProvider) provider = metaMaskProvider;
    }

    try {
      setError("");

      const chainId = await provider.request({ method: "eth_chainId" });
      const sepoliaChainId = "0xaa36a7"; // 11155111
      const localhostChainId = "0x7a69"; // 31337

      if (chainId !== sepoliaChainId && chainId !== localhostChainId) {
        setError("Wrong Network! Please connect to Sepolia or Localhost.");
        try {
          await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: sepoliaChainId }],
          });
        } catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask.
          if (switchError.code === 4902) {
            setError("Sepolia network not found. Please switch manually in MetaMask.");
          } else {
            setError("Failed to switch to the network.");
          }
        }
        return;
      }

      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });
      const web3Instance = new Web3(provider);
      const contractInstance = new web3Instance.eth.Contract(
        CONTRACT_ABI,
        CONTRACT_ADDRESS
      );

      setWeb3(web3Instance);
      setContract(contractInstance);
      setAccount(accounts[0]);



    } catch (err) {
      setError("Failed to connect wallet: " + err.message);
    }
  }, []);

  // --- Read contract values ---
  const readContractData = useCallback(async () => {
    if (!contract) return;
    try {
      const val = await contract.methods.getValue().call();
      setStoredValue(val.toString());
      const owner = await contract.methods.owner().call();
      setContractOwner(owner);

      // Check if current user is authorized (owner or allowlisted)
      if (account) {
        const allowed = await contract.methods.allowlist(account).call();
        setIsAuthorized(
          account.toLowerCase() === owner.toLowerCase() || allowed
        );
      }

      setError(""); // Clear error if successful
    } catch (err) {
      console.error("Read error:", err);
      // Try to provide a helpful error message
      if (err.message && err.message.includes("network")) {
        setError("Network Error: Make sure MetaMask is connected to Sepolia.");
      } else {
        setError("Failed to read: " + (err.message || err.toString()));
      }
    }
  }, [contract]);

  // --- Fetch Past Events ---
  const fetchPastEvents = useCallback(async () => {
    if (!contract || !web3) return;
    try {
      // Get past ValueChanged events
      const pastEvents = await contract.getPastEvents("ValueChanged", {
        fromBlock: 0,
        toBlock: "latest", // or 'latest'
      });

      const formattedEvents = await Promise.all(
        pastEvents.map(async (ev) => {
          // Fetch block timestamp for each event
          const block = await web3.eth.getBlock(ev.blockNumber);
          return {
            id: ev.transactionHash + ev.logIndex,
            name: "ValueChanged",
            user: ev.returnValues.user,
            value: ev.returnValues.value.toString(),
            txHash: ev.transactionHash,
            time: new Date(Number(block.timestamp) * 1000).toLocaleTimeString(),
            timestamp: Number(block.timestamp), // For sorting
          };
        })
      );

      // Sort by timestamp descending
      formattedEvents.sort((a, b) => b.timestamp - a.timestamp);

      setEvents((prev) => {
        // Merge with existing real-time events if needed, but for now just replace on load
        // Or better, filter out duplicates
        return formattedEvents;
      });
    } catch (err) {
      console.error("Error fetching past events:", err);
    }
  }, [contract, web3]);

  useEffect(() => {
    if (contract) {
      readContractData();
      fetchPastEvents();
    }
  }, [contract, readContractData, fetchPastEvents]);

  // --- Listen for account changes ---
  useEffect(() => {
    if (web3 && web3.currentProvider) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount("");
          setContract(null);
          setWeb3(null);
        }
      };
      // Use standard 'on' or 'removeListener' methods, 
      // but some providers might use 'addListener' / 'removeListener'
      // Most EIP-1193 providers support 'on'
      web3.currentProvider.on("accountsChanged", handleAccountsChanged);

      return () => {
        // Some providers (like older MetaMask) might need removeListener
        if (web3.currentProvider.removeListener) {
          web3.currentProvider.removeListener("accountsChanged", handleAccountsChanged);
        }
      };
    }
  }, [web3]);

  // --- Set Value (Task 2: send tx, show hash, emit events) ---
  const handleSetValue = async () => {
    if (!contract || !account) return;
    if (!newValue || isNaN(newValue)) {
      setError("Please enter a valid number.");
      return;
    }

    setError("");
    setLoading(true);
    setTxHash("");

    try {
      const receipt = await contract.methods
        .setValue(parseInt(newValue))
        .send({ from: account });

      setTxHash(receipt.transactionHash);

      // Parse emitted events
      if (receipt.events && receipt.events.ValueChanged) {
        const ev = receipt.events.ValueChanged;
        setEvents((prev) => [
          {
            id: Date.now(),
            name: "ValueChanged",
            user: ev.returnValues.user,
            value: ev.returnValues.value.toString(),
            txHash: receipt.transactionHash,
            time: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);
      }

      setNewValue("");
      await readContractData();
    } catch (err) {
      if (err.message.includes("Not the contract owner")) {
        setError("⛔ Access Denied: Only the contract owner can set the value.");
      } else if (err.message.includes("User denied")) {
        setError("Transaction was rejected by user.");
      } else {
        setError("Transaction failed: " + err.message.slice(0, 120));
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Reset Value (Owner Only) ---
  const handleResetValue = async () => {
    if (!contract || !account) return;
    setResetLoading(true);
    try {
      const receipt = await contract.methods.resetValue().send({ from: account });
      setTxHash(receipt.transactionHash);

      // Add event to local state (or rely on fetch)
      setEvents((prev) => [
        {
          id: Date.now(),
          name: "ValueReset",
          user: "Owner",
          value: "0",
          txHash: receipt.transactionHash,
          time: new Date().toLocaleTimeString(),
        },
        ...prev
      ]);

      await readContractData();
    } catch (err) {
      setError("Reset failed: " + err.message);
    } finally {
      setResetLoading(false);
    }
  };

  // --- Access Control (Owner Only) ---
  const handleGrantAccess = async () => {
    if (!contract || !account || !accessUser) return;
    setAccessLoading(true);
    try {
      await contract.methods.grantAccess(accessUser).send({ from: account });
      setAccessUser("");
      alert(`Access granted to ${accessUser}`);
    } catch (err) {
      setError("Grant access failed: " + err.message);
    } finally {
      setAccessLoading(false);
    }
  };

  const handleRevokeAccess = async () => {
    if (!contract || !account || !accessUser) return;
    setAccessLoading(true);
    try {
      await contract.methods.revokeAccess(accessUser).send({ from: account });
      setAccessUser("");
      alert(`Access revoked from ${accessUser}`);
    } catch (err) {
      setError("Revoke access failed: " + err.message);
    } finally {
      setAccessLoading(false);
    }
  };

  // --- Transfer Ownership (Task 3) ---
  const handleTransferOwnership = async () => {
    if (!contract || !account) return;
    if (!newOwnerAddr || !Web3.utils.isAddress(newOwnerAddr)) {
      setError("Please enter a valid Ethereum address.");
      return;
    }

    setError("");
    setTransferLoading(true);

    try {
      const receipt = await contract.methods
        .transferOwnership(newOwnerAddr)
        .send({ from: account });

      if (receipt.events && receipt.events.OwnershipTransferred) {
        const ev = receipt.events.OwnershipTransferred;
        setEvents((prev) => [
          {
            id: Date.now(),
            name: "OwnershipTransferred",
            user: ev.returnValues.previousOwner,
            value: `→ ${ev.returnValues.newOwner.slice(0, 10)}...`,
            txHash: receipt.transactionHash,
            time: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);
      }

      setNewOwnerAddr("");
      setTxHash(receipt.transactionHash);
      await readContractData();
    } catch (err) {
      if (err.message.includes("Not the contract owner")) {
        setError("⛔ Access Denied: Only the current owner can transfer ownership.");
      } else {
        setError("Transfer failed: " + err.message.slice(0, 120));
      }
    } finally {
      setTransferLoading(false);
    }
  };

  // --- Not connected screen ---
  if (!account) {
    return (
      <>
        <Particles />
        <div className="app">
          <div className="hero">
            <img
              src="/hero-banner.png"
              alt="Blockchain DApp"
              className="hero-image"
            />
            <div className="hero-overlay">
              <h1>Storage DApp</h1>
              <p>A decentralized smart contract interface</p>
            </div>
          </div>
          <div className="connect-screen">
            <div className="metamask-logo">🦊</div>
            <h2>Connect Your Wallet</h2>
            <p>
              Link your MetaMask wallet to interact with the Storage smart
              contract on the blockchain.
            </p>
            <button className="connect-btn" onClick={connectWallet}>
              <span>🔗 Connect MetaMask</span>
            </button>
            {error && (
              <div className="error-toast" style={{ marginTop: 20 }}>
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // --- Connected UI ---
  return (
    <>
      <Particles />
      <div className="app">
        {/* Hero */}
        <div className="hero">
          <img
            src="/hero-banner.png"
            alt="Blockchain DApp"
            className="hero-image"
          />
          <div className="hero-overlay">
            <h1>Storage DApp</h1>
            <p>Interact with your deployed smart contract</p>
          </div>
        </div>

        {/* Status Bar */}
        <div className="status-bar">
          <div className={`status-dot ${account ? "connected" : "disconnected"}`} />
          <span className="label">Wallet</span>
          <span className="account">
            {account}
          </span>
          <span className={`owner-badge ${isOwner ? "is-owner" : (isAuthorized ? "is-authorized" : "not-owner")}`}>
            {isOwner ? "👑 Owner" : (isAuthorized ? "✅ Authorized" : "👤 User")}
          </span>
        </div>

        {/* Main Grid */}
        <div className="grid">
          {/* Card 1: Read Value (Task 1) */}
          <div className="card">
            <div className="card-header">
              <div className="card-icon cyan">📖</div>
              <h2>Stored Value</h2>
              <button
                className="refresh-btn"
                onClick={readContractData}
                style={{ marginLeft: "auto" }}
              >
                🔄 Refresh
              </button>
            </div>
            <div className="value-display">
              <div className="value-number">{storedValue}</div>
              <div className="value-label">Current On-Chain Value</div>
            </div>
          </div>

          {/* Card 2: Set Value (Task 2 & 3) */}
          <div className="card">
            <div className="card-header">
              <div className="card-icon purple">✏️</div>
              <h2>Set Value</h2>
            </div>

            {!isAuthorized && (
              <div className="error-toast" style={{ marginBottom: 16 }}>
                <span className="error-icon">🔒</span>
                Only authorized users can set values.
              </div>
            )}

            <div className="input-group">
              <input
                type="number"
                placeholder="Enter new value..."
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                disabled={!isAuthorized || loading}
                onKeyDown={(e) => e.key === "Enter" && isAuthorized && handleSetValue()}
              />
              <button
                className="btn btn-primary"
                onClick={handleSetValue}
                disabled={!isAuthorized || loading || !newValue}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    Sending...
                  </>
                ) : (
                  "Set Value"
                )}
              </button>
            </div>

            {txHash && (
              <div className="tx-hash">
                <div className="label">✅ Transaction Hash</div>
                <code>{txHash}</code>
              </div>
            )}

            {error && (
              <div className="error-toast">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Second Row */}
        <div className="grid">
          {/* Card 3: Transfer Ownership (Task 3) */}
          <div className="card">
            <div className="card-header">
              <div className="card-icon pink">👑</div>
              <h2>Admin Controls</h2>
            </div>

            <div className="section-title">Ownership</div>

            <div className="owner-address">
              <div className="label">Current Owner</div>
              <code>{contractOwner || "Loading..."}</code>
            </div>

            {isOwner ? (
              <>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="New owner address (0x...)"
                    value={newOwnerAddr}
                    onChange={(e) => setNewOwnerAddr(e.target.value)}
                    disabled={transferLoading}
                  />
                  <button
                    className="btn btn-pink"
                    onClick={handleTransferOwnership}
                    disabled={transferLoading || !newOwnerAddr}
                  >
                    {transferLoading ? "Transferring..." : "Transfer"}
                  </button>
                </div>

                <div className="section-title" style={{ marginTop: 20 }}>Access Control</div>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="User address to Allow/Auth..."
                    value={accessUser}
                    onChange={(e) => setAccessUser(e.target.value)}
                    disabled={accessLoading}
                  />
                  <button
                    className="btn btn-cyan"
                    onClick={handleGrantAccess}
                    disabled={accessLoading || !accessUser}
                  >
                    Grant
                  </button>
                  <button
                    className="btn btn-pink"
                    onClick={handleRevokeAccess}
                    disabled={accessLoading || !accessUser}
                    style={{ background: 'rgba(255, 64, 129, 0.1)', border: '1px solid rgba(255, 64, 129, 0.3)' }}
                  >
                    Revoke
                  </button>
                </div>
              </>
            ) : (
              <div
                className="empty-state"
                style={{ padding: "10px 0" }}
              >
                <p style={{ fontSize: "0.82rem" }}>
                  Admin controls are restricted to the owner.
                </p>
              </div>
            )}
          </div>

          {/* Card 4: Event Log (Task 2) */}
          <div className="card">
            <div className="card-header">
              <div className="card-icon green">📡</div>
              <h2>Event Log</h2>
            </div>

            {events.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <p>No events yet. Set a value to emit events.</p>
              </div>
            ) : (
              <div className="event-log">
                {events.map((ev) => (
                  <div key={ev.id} className="event-item">
                    <div className="event-header">
                      <span className="event-name">{ev.name}</span>
                      <span className="event-time">{ev.time}</span>
                    </div>
                    <div className="event-detail">
                      <span>User:</span> {ev.user?.slice(0, 10)}...
                      <br />
                      <span>Value:</span> {ev.value}
                      <br />
                      <span>Tx:</span> {ev.txHash?.slice(0, 18)}...
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="footer">
          Storage DApp — Built with Hardhat, React, and Web3.js
        </div>
      </div>
    </>
  );
}

export default App;
