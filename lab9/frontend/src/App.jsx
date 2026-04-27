import { useState, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import GameItemsArtifact from './contracts/GameItems.json';
import './index.css';

function App() {
  const [account, setAccount] = useState('');
  const [accountsList, setAccountsList] = useState([]);
  const [contractAddress, setContractAddress] = useState('0xdDbC198B8B7F8A7c75E24C39d6a9873F5dB50eC8');
  const [status, setStatus] = useState('');

  // Inventory state
  const [inventory, setInventory] = useState({ 0: 0, 2: 0, 5: 0 });

  // Transfer state
  const [transferTo, setTransferTo] = useState('');
  const [transferAmounts, setTransferAmounts] = useState({ 0: '', 2: '', 5: '' });

  // Query state
  const [searchAddress, setSearchAddress] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Transaction history
  const [txHistory, setTxHistory] = useState([]);

  const addTx = (type, label, hash) => {
    setTxHistory(prev => [{
      type,
      label,
      hash,
      time: new Date().toLocaleTimeString()
    }, ...prev]);
  };

  // Auto-clear status toast
  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  useEffect(() => {
    if (account) {
      fetchBalances(account);
    }
  }, [account, contractAddress]);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" }).then(accounts => {
        setAccountsList(accounts);
      });

      const handleAccountsChanged = (accounts) => {
        setAccountsList(accounts);
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount('');
        }
      };
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  const fetchBalances = async (addr) => {
    const target = addr || account;
    if (!target || !contractAddress) return;
    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(contractAddress, GameItemsArtifact.abi, provider);

      const accountsArr = [target, target, target];
      const idsArr = [0, 2, 5]; // Gold, Sword, Legendary

      const balances = await contract.balanceOfBatch(accountsArr, idsArr);

      setInventory({
        0: Number(balances[0]),
        2: Number(balances[1]),
        5: Number(balances[2])
      });
    } catch (err) {
      console.error("Error fetching balances:", err);
      setStatus('❌ Failed to load inventory: ' + err.message);
    }
  };



  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);
        const allAccounts = await window.ethereum.request({ method: "eth_accounts" });
        setAccountsList(allAccounts);
        setStatus("✅ Wallet connected successfully!");
      } catch (err) {
        setStatus("❌ Error connecting wallet: " + err.message);
      }
    } else {
      setStatus("⚠️ Please install MetaMask!");
    }
  };

  const mintItem = async (id, amount, name) => {
    if (!account || !contractAddress) {
      setStatus("⚠️ Connect wallet and verify contract address first.");
      return;
    }
    setStatus(`⏳ Minting ${amount} ${name}... Confirm in MetaMask.`);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const currentAddress = await signer.getAddress();
      const contract = new Contract(contractAddress, GameItemsArtifact.abi, signer);

      const tx = await contract.mint(currentAddress, id, amount);
      setStatus(`⏳ Transaction sent! Mining...`);
      const receipt = await tx.wait();
      addTx('mint', `Mint ${amount}× ${name}`, receipt.hash);
      setStatus(`✅ Success! Minted ${amount} ${name}.`);
      await fetchBalances(currentAddress);
    } catch (err) {
      setStatus("❌ Error minting: " + err.message);
    }
  };

  const transferBatch = async () => {
    if (!account || !transferTo) {
      setStatus("⚠️ Please enter a recipient address.");
      return;
    }

    const idsToTransfer = [];
    const amountsToTransfer = [];
    const itemNames = { 0: 'Gold', 2: 'Iron Sword', 5: 'Legendary' };

    for (const [id, amountStr] of Object.entries(transferAmounts)) {
      const amount = Number(amountStr);
      if (amount > 0) {
        if (amount > inventory[id]) {
          setStatus(`❌ Insufficient balance! You only have ${inventory[id]} ${itemNames[id]}.`);
          return;
        }
        idsToTransfer.push(Number(id));
        amountsToTransfer.push(amount);
      }
    }

    if (idsToTransfer.length === 0) {
      setStatus("⚠️ Please enter an amount for at least one item.");
      return;
    }

    setStatus(`⏳ Transferring items... Confirm in MetaMask.`);
    try {
      const provider = new BrowserProvider(window.ethereum);
      // Ensure we get the signer for the selected account
      const signer = await provider.getSigner(account);
      const currentAddress = await signer.getAddress();
      const contract = new Contract(contractAddress, GameItemsArtifact.abi, signer);

      // safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data)
      const tx = await contract.safeBatchTransferFrom(currentAddress, transferTo, idsToTransfer, amountsToTransfer, "0x");
      setStatus(`⏳ Batch transfer transaction sent! Mining...`);
      const receipt = await tx.wait();
      
      const transferDesc = idsToTransfer.map((id, index) => `${amountsToTransfer[index]}× ${itemNames[id]}`).join(', ');
      addTx('transfer', `Batch Transfer (${transferDesc}) → ${transferTo.slice(0,8)}...`, receipt.hash);
      
      setStatus(`✅ Batch transfer successful!`);
      setTransferTo('');
      setTransferAmounts({ 0: '', 2: '', 5: '' });
      await fetchBalances(currentAddress);
    } catch (err) {
      setStatus("❌ Error in batch transfer: " + err.message);
    }
  };

  const handleSearch = async () => {
    if (!searchAddress || !contractAddress) {
      setStatus("⚠️ Please enter an address to query.");
      return;
    }

    if (!searchAddress.startsWith('0x') || searchAddress.length !== 42) {
      setStatus("⚠️ Invalid Ethereum address.");
      return;
    }

    setIsSearching(true);
    setStatus(`⏳ Querying inventory for ${searchAddress.slice(0, 8)}...`);

    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(contractAddress, GameItemsArtifact.abi, provider);

      const idsArr = [0, 2, 5]; // Gold, Sword, Legendary
      const accountsArr = [searchAddress, searchAddress, searchAddress];

      const balances = await contract.balanceOfBatch(accountsArr, idsArr);

      setSearchResult({
        address: searchAddress,
        inventory: {
          0: Number(balances[0]),
          2: Number(balances[1]),
          5: Number(balances[2])
        }
      });
      setStatus("✅ Query complete!");
    } catch (err) {
      console.error("Error querying address:", err);
      setStatus("❌ Failed to query address: " + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      <div className="header-bar">
        <div>
          <h1>🗡️ Ethereal Realms</h1>
          <div className="contract-badge" style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#a0aec0', textAlign: 'left' }}>
            Contract: <code style={{ color: '#00f2fe', background: 'rgba(0,242,254,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{contractAddress}</code>
          </div>
        </div>
        {!account ? (
          <button className="wallet-btn" onClick={connectWallet}>Connect MetaMask</button>
        ) : (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              className="wallet-btn"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', backgroundColor: '#1a1a24', color: '#e2e8f0', border: '1px solid #c8aa6e', borderRadius: '8px', cursor: 'pointer' }}
            >
              {accountsList.map(acc => (
                <option key={acc} value={acc}>
                  {acc.slice(0, 6)}...{acc.slice(-4)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {account && (
        <div className="profile-panel glass-panel">
          <h2>🛡️ Your Inventory</h2>
          <div className="inventory-stats">
            <div className="stat">
              <img src="/gold.png" alt="Gold" className="stat-icon" />
              <span>{inventory[0]} Gold</span>
            </div>
            <div className="stat">
              <img src="/sword.png" alt="Sword" className="stat-icon" />
              <span>{inventory[2]} Swords</span>
            </div>
            <div className="stat">
              <img src="/trophy.png" alt="Trophy" className="stat-icon" />
              <span>{inventory[5]} Legendary</span>
            </div>
          </div>

          <div className="transfer-section">
            <h3>💸 Batch Transfer Items</h3>
            <div className="transfer-batch-controls" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aec0', marginBottom: '0.3rem' }}>Gold</label>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={transferAmounts[0]}
                    onChange={(e) => setTransferAmounts({ ...transferAmounts, 0: e.target.value })}
                    min="0"
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.4)', color: 'white', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aec0', marginBottom: '0.3rem' }}>Swords</label>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={transferAmounts[2]}
                    onChange={(e) => setTransferAmounts({ ...transferAmounts, 2: e.target.value })}
                    min="0"
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.4)', color: 'white', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aec0', marginBottom: '0.3rem' }}>Legendary</label>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={transferAmounts[5]}
                    onChange={(e) => setTransferAmounts({ ...transferAmounts, 5: e.target.value })}
                    min="0"
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.4)', color: 'white', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input
                  type="text"
                  placeholder="Recipient Address (0x...)"
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  style={{ flex: 2, padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.4)', color: 'white', boxSizing: 'border-box' }}
                />
                <button className="wallet-btn" onClick={transferBatch} style={{ flex: 1, whiteSpace: 'nowrap' }}>Batch Send</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="query-panel glass-panel">
        <h2>🔍 Query Player Inventory</h2>
        <div className="query-controls">
          <input
            type="text"
            placeholder="Enter Address (0x...)"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            className="search-input"
          />
          <button
            className="wallet-btn search-btn"
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {searchResult && (
          <div className="query-results animate-in">
            <div className="result-header">
              <span>Results for: </span>
              <code className="result-addr">{searchResult.address}</code>
            </div>
            <div className="result-grid">
              <div className="res-stat gold">
                <span className="res-val">{searchResult.inventory[0]}</span>
                <span className="res-label">Gold</span>
              </div>
              <div className="res-stat sword">
                <span className="res-val">{searchResult.inventory[2]}</span>
                <span className="res-label">Swords</span>
              </div>
              <div className="res-stat legendary">
                <span className="res-val">{searchResult.inventory[5]}</span>
                <span className="res-label">Legendary</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="items-grid">
        {/* GOLD CARD */}
        <div className="item-card">
          <img src="/gold.png" alt="Gold Coins" className="item-image" />
          <div className="item-title gold-title">Magical Gold</div>
          <div className="token-id">Token ID: 0</div>
          <div className="item-desc">A pile of enchanted gold coins used for trading in the realm.</div>
          <button
            className="mint-btn btn-gold"
            onClick={() => mintItem(0, 100, "Gold")}
          >
            Mint 100 Gold
          </button>
        </div>

        {/* SWORD CARD */}
        <div className="item-card">
          <img src="/sword.png" alt="Iron Sword" className="item-image" />
          <div className="item-title sword-title">Iron Sword</div>
          <div className="token-id">Token ID: 2</div>
          <div className="item-desc">A basic but reliable weapon for beginners. Deals 10 damage.</div>
          <button
            className="mint-btn btn-sword"
            onClick={() => mintItem(2, 1, "Iron Sword")}
          >
            Mint 1 Sword
          </button>
        </div>

        {/* LEGENDARY REWARD CARD */}
        <div className="item-card">
          <img src="/trophy.png" alt="Legendary Trophy" className="item-image floating" />
          <div className="item-title legendary-title">Legendary Artifact</div>
          <div className="token-id">Token ID: 5</div>
          <div className="item-desc">The ultimate 1-of-1 NFT prize for the bravest warriors.</div>
          <button
            className="mint-btn btn-legendary"
            onClick={() => mintItem(5, 1, "Legendary Artifact")}
          >
            Claim Legendary
          </button>
        </div>
      </div>

      {txHistory.length > 0 && (
        <div className="tx-panel glass-panel">
          <h2>📜 Transaction History</h2>
          <div className="tx-list">
            {txHistory.map((tx, i) => (
              <div key={i} className={`tx-row animate-in ${tx.type}`}>
                <div className="tx-meta">
                  <span className={`tx-badge tx-badge-${tx.type}`}>
                    {tx.type === 'mint' ? '⚒️ Mint' : '↗️ Transfer'}
                  </span>
                  <span className="tx-label">{tx.label}</span>
                  <span className="tx-time">{tx.time}</span>
                </div>
                <a
                  className="tx-hash"
                  href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View on Etherscan"
                >
                  {tx.hash.slice(0, 18)}...{tx.hash.slice(-8)}
                  <span className="tx-link-icon">↗</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {status && (
        <div className="status-toast">
          {status}
        </div>
      )}
    </>
  );
}

export default App;
