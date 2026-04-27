import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import GameItemsABI from './GameItems.json';

const CONTRACT_ADDRESS = '0xf507B546a363C09c224653FA89ADCB8C48648FD3';

// All 6 token definitions
const TOKENS = [
  { id: 0, name: 'Gold',             emoji: '🪙', type: 'fungible',  color: '#ffd700', glow: 'rgba(255,215,0,0.4)',     desc: 'Enchanted gold coins used for trading across the realm.' },
  { id: 1, name: 'Silver',           emoji: '🥈', type: 'fungible',  color: '#c0c0c0', glow: 'rgba(192,192,192,0.4)',   desc: 'Silver pieces for everyday transactions and crafting.' },
  { id: 2, name: 'Iron Sword',       emoji: '⚔️', type: 'nft',       color: '#7eb8ff', glow: 'rgba(126,184,255,0.4)',   desc: 'A rare NFT weapon forged in the fires of Mount Etheron.' },
  { id: 3, name: 'Shield',           emoji: '🛡️', type: 'fungible',  color: '#68d391', glow: 'rgba(104,211,145,0.4)',   desc: 'Protective gear crafted from dragonhide leather.' },
  { id: 4, name: 'Crown',            emoji: '👑', type: 'fungible',  color: '#f6ad55', glow: 'rgba(246,173,85,0.4)',    desc: 'A symbol of nobility. Only the worthy may wear it.' },
  { id: 5, name: 'Legendary Reward', emoji: '🏆', type: 'nft-prize', color: '#f53fc8', glow: 'rgba(245,63,200,0.6)',    desc: '1-of-1 NFT prize. The ultimate reward for the champion.' },
];

const TARGET_ADDRESS = '0xf16095EEFBA8B88fe92180c1aca76B17ea68B101';
const ETHERSCAN = 'https://sepolia.etherscan.io';

// ── Helpers ───────────────────────────────────────────────────────────────────
function shortAddr(addr) {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function getContract(signerOrProvider) {
  return new Contract(CONTRACT_ADDRESS, GameItemsABI.abi, signerOrProvider);
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [account, setAccount]           = useState('');
  const [accountsList, setAccountsList] = useState([]);
  const [balances, setBalances]         = useState({});
  const [status, setStatus]             = useState(null); // { type: 'success'|'error'|'loading', msg }
  const [txHistory, setTxHistory]       = useState([]);
  const [activeTab, setActiveTab]       = useState('mint'); // 'mint' | 'transfer' | 'batch' | 'query'

  // Transfer (single)
  const [tfTo, setTfTo]         = useState('');
  const [tfId, setTfId]         = useState('0');
  const [tfAmt, setTfAmt]       = useState('');

  // Batch transfer
  const [batchTo, setBatchTo]   = useState('');
  const [batchRows, setBatchRows] = useState([{ id: '0', amount: '' }]);

  // Query
  const [queryAddr, setQueryAddr]     = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [isQuerying, setIsQuerying]   = useState(false);

  // Mint custom
  const [mintId, setMintId]   = useState('0');
  const [mintAmt, setMintAmt] = useState('');

  // ── Status helpers ────────────────────────────────────────────────────────
  const showStatus = useCallback((type, msg) => {
    setStatus({ type, msg });
    if (type !== 'loading') setTimeout(() => setStatus(null), 6000);
  }, []);

  const addTx = useCallback((label, hash) => {
    setTxHistory(prev => [{ label, hash, time: new Date().toLocaleTimeString() }, ...prev]);
  }, []);

  // ── Fetch all balances for an address ────────────────────────────────────
  const fetchBalances = useCallback(async (addr) => {
    if (!addr) return;
    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = getContract(provider);
      const ids = TOKENS.map(t => t.id);
      const addrs = ids.map(() => addr);
      const raw = await contract.balanceOfBatch(addrs, ids);
      const result = {};
      ids.forEach((id, i) => { result[id] = Number(raw[i]); });
      setBalances(result);
    } catch (err) {
      console.error('fetchBalances:', err);
    }
  }, []);

  // ── Wallet connect ────────────────────────────────────────────────────────
  const connectWallet = async () => {
    if (!window.ethereum) { showStatus('error', '⚠️ Install MetaMask first!'); return; }
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      setAccount(accounts[0]);
      const all = await window.ethereum.request({ method: 'eth_accounts' });
      setAccountsList(all);
      showStatus('success', '✅ Wallet connected!');
    } catch (err) {
      showStatus('error', '❌ ' + err.message);
    }
  };

  useEffect(() => {
    if (!window.ethereum) return;
    window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
      setAccountsList(accounts);
    });
    const onChange = (accounts) => {
      setAccountsList(accounts);
      setAccount(accounts[0] || '');
    };
    window.ethereum.on('accountsChanged', onChange);
    return () => window.ethereum.removeListener('accountsChanged', onChange);
  }, []);

  useEffect(() => { if (account) fetchBalances(account); }, [account, fetchBalances]);

  // ── Mint single ───────────────────────────────────────────────────────────
  const handleMint = async () => {
    if (!account) { showStatus('error', '⚠️ Connect your wallet first.'); return; }
    if (!mintAmt || Number(mintAmt) < 1) { showStatus('error', '⚠️ Enter a valid amount.'); return; }
    const token = TOKENS.find(t => t.id === Number(mintId));
    showStatus('loading', `⏳ Minting ${mintAmt}× ${token.name}… Confirm in MetaMask.`);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer   = await provider.getSigner();
      const contract = getContract(signer);
      const tx       = await contract.mint(account, mintId, mintAmt);
      showStatus('loading', '⛏️ Transaction mining…');
      const receipt  = await tx.wait();
      addTx(`⚒️ Mint ${mintAmt}× ${token.name}`, receipt.hash);
      showStatus('success', `✅ Minted ${mintAmt}× ${token.name}!`);
      setMintAmt('');
      fetchBalances(account);
    } catch (err) {
      showStatus('error', '❌ ' + (err.reason || err.message));
    }
  };

  // ── mintBatch quick (Gold + Sword) ────────────────────────────────────────
  const handleMintBatch = async () => {
    if (!account) { showStatus('error', '⚠️ Connect your wallet first.'); return; }
    showStatus('loading', '⏳ Batch minting Gold + Shield… Confirm in MetaMask.');
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer   = await provider.getSigner();
      const contract = getContract(signer);
      const tx       = await contract.mintBatch(account, [0, 3], [500, 25]);
      showStatus('loading', '⛏️ Transaction mining…');
      const receipt  = await tx.wait();
      addTx('⚒️ MintBatch: 500 Gold + 25 Shield', receipt.hash);
      showStatus('success', '✅ Batch minted 500 Gold + 25 Shield!');
      fetchBalances(account);
    } catch (err) {
      showStatus('error', '❌ ' + (err.reason || err.message));
    }
  };

  // ── Single transfer (safeTransferFrom) ───────────────────────────────────
  const handleTransfer = async () => {
    if (!account || !tfTo || !tfAmt) { showStatus('error', '⚠️ Fill all fields.'); return; }
    if (!tfTo.startsWith('0x') || tfTo.length !== 42) { showStatus('error', '⚠️ Invalid recipient address.'); return; }
    const token = TOKENS.find(t => t.id === Number(tfId));
    const bal = balances[Number(tfId)] || 0;
    if (Number(tfAmt) > bal) { showStatus('error', `❌ You only have ${bal} ${token.name}.`); return; }
    showStatus('loading', `⏳ Transferring ${tfAmt}× ${token.name}… Confirm in MetaMask.`);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer   = await provider.getSigner();
      const addr     = await signer.getAddress();
      const contract = getContract(signer);
      const tx       = await contract.safeTransferFrom(addr, tfTo, tfId, tfAmt, '0x');
      showStatus('loading', '⛏️ Transaction mining…');
      const receipt  = await tx.wait();
      addTx(`↗️ Transfer ${tfAmt}× ${token.name} → ${shortAddr(tfTo)}`, receipt.hash);
      showStatus('success', `✅ Transferred ${tfAmt}× ${token.name}!`);
      setTfTo(''); setTfAmt('');
      fetchBalances(account);
    } catch (err) {
      showStatus('error', '❌ ' + (err.reason || err.message));
    }
  };

  // ── Batch transfer (safeBatchTransferFrom) ────────────────────────────────
  const addBatchRow = () => setBatchRows(r => [...r, { id: '0', amount: '' }]);
  const removeBatchRow = (i) => setBatchRows(r => r.filter((_, idx) => idx !== i));
  const updateBatchRow = (i, field, val) =>
    setBatchRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row));

  const handleBatchTransfer = async () => {
    if (!account || !batchTo) { showStatus('error', '⚠️ Fill recipient and items.'); return; }
    if (!batchTo.startsWith('0x') || batchTo.length !== 42) { showStatus('error', '⚠️ Invalid recipient address.'); return; }
    const ids     = batchRows.map(r => Number(r.id));
    const amounts = batchRows.map(r => Number(r.amount));
    if (amounts.some(a => !a || a < 1)) { showStatus('error', '⚠️ All amounts must be ≥ 1.'); return; }
    showStatus('loading', '⏳ Batch transferring… Confirm in MetaMask.');
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer   = await provider.getSigner();
      const addr     = await signer.getAddress();
      const contract = getContract(signer);
      const tx       = await contract.safeBatchTransferFrom(addr, batchTo, ids, amounts, '0x');
      showStatus('loading', '⛏️ Transaction mining…');
      const receipt  = await tx.wait();
      const summary  = batchRows.map(r => `${r.amount}× ${TOKENS.find(t => t.id === Number(r.id))?.name}`).join(', ');
      addTx(`↗️ BatchTransfer [${summary}] → ${shortAddr(batchTo)}`, receipt.hash);
      showStatus('success', '✅ Batch transfer complete!');
      setBatchTo(''); setBatchRows([{ id: '0', amount: '' }]);
      fetchBalances(account);
    } catch (err) {
      showStatus('error', '❌ ' + (err.reason || err.message));
    }
  };

  // ── Query address ─────────────────────────────────────────────────────────
  const handleQuery = async () => {
    if (!queryAddr || !queryAddr.startsWith('0x') || queryAddr.length !== 42) {
      showStatus('error', '⚠️ Enter a valid Ethereum address.');
      return;
    }
    setIsQuerying(true);
    setQueryResult(null);
    showStatus('loading', `🔍 Querying ${shortAddr(queryAddr)}…`);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = getContract(provider);
      const ids      = TOKENS.map(t => t.id);
      const addrs    = ids.map(() => queryAddr);
      const raw      = await contract.balanceOfBatch(addrs, ids);
      const inv      = {};
      ids.forEach((id, i) => { inv[id] = Number(raw[i]); });
      setQueryResult({ address: queryAddr, inv });
      showStatus('success', '✅ Query complete!');
    } catch (err) {
      showStatus('error', '❌ ' + err.message);
    } finally {
      setIsQuerying(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app-wrapper">
      {/* Ambient background particles */}
      <div className="bg-particles" aria-hidden="true">
        {[...Array(12)].map((_, i) => <div key={i} className={`particle p${i}`} />)}
      </div>

      {/* ── Header ── */}
      <header className="header">
        <div className="header-brand">
          <span className="header-logo">⚔️</span>
          <div>
            <h1 className="header-title">Ethereal Realms</h1>
            <p className="header-sub">ERC-1155 Web3 RPG · Sepolia Testnet</p>
          </div>
        </div>

        <div className="header-right">
          {account ? (
            <>
              <select
                id="account-select"
                className="account-select"
                value={account}
                onChange={e => { setAccount(e.target.value); fetchBalances(e.target.value); }}
              >
                {accountsList.map(a => (
                  <option key={a} value={a}>{shortAddr(a)}</option>
                ))}
              </select>
              <button className="btn-refresh" onClick={() => fetchBalances(account)} title="Refresh balances">↻</button>
            </>
          ) : (
            <button id="connect-wallet-btn" className="btn-connect" onClick={connectWallet}>
              <span>🦊</span> Connect MetaMask
            </button>
          )}
        </div>
      </header>

      <main className="main-content">
        {/* ── Inventory Panel ── */}
        {account && (
          <section className="inventory-panel glass" aria-label="Your Inventory">
            <div className="panel-header">
              <span className="panel-icon">🎒</span>
              <h2>Your Inventory</h2>
              <span className="address-badge" title={account}>{shortAddr(account)}</span>
            </div>
            <div className="inventory-grid">
              {TOKENS.map(token => (
                <div
                  key={token.id}
                  className={`inv-card inv-${token.type}`}
                  style={{ '--tok-color': token.color, '--tok-glow': token.glow }}
                >
                  <span className="inv-emoji">{token.emoji}</span>
                  <span className="inv-balance">{balances[token.id] ?? '—'}</span>
                  <span className="inv-name">{token.name} (ID: {token.id})</span>
                  {token.type === 'nft' && <span className="inv-badge">NFT</span>}
                  {token.type === 'nft-prize' && <span className="inv-badge prize">1-of-1 PRIZE</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Contract Info ── */}
        <section className="contract-info glass">
          <div className="ci-row">
            <span className="ci-label">Contract</span>
            <a
              href={`${ETHERSCAN}/address/${CONTRACT_ADDRESS}`}
              target="_blank" rel="noopener noreferrer"
              className="ci-link"
            >
              {CONTRACT_ADDRESS} ↗
            </a>
          </div>
          <div className="ci-row">
            <span className="ci-label">Network</span>
            <span className="ci-value">Ethereum Sepolia Testnet</span>
          </div>
          <div className="ci-row">
            <span className="ci-label">Standard</span>
            <span className="ci-value">ERC-1155 (Multi-Token)</span>
          </div>
        </section>

        {/* ── Action Tabs ── */}
        <section className="action-section">
          <div className="tabs" role="tablist">
            {[
              { key: 'mint',     label: '⚒️ Mint' },
              { key: 'transfer', label: '↗️ Transfer' },
              { key: 'batch',    label: '📦 Batch Transfer' },
              { key: 'query',    label: '🔍 Query' },
            ].map(tab => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={activeTab === tab.key}
                className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="tab-content glass">
            {/* ── MINT TAB ── */}
            {activeTab === 'mint' && (
              <div className="tab-pane" id="tab-mint">
                <h3 className="tab-title">Mint Tokens</h3>
                <p className="tab-desc">Call <code>mint()</code> or <code>mintBatch()</code> to create tokens for your wallet.</p>

                {/* Quick mint cards */}
                <div className="quick-mint-grid">
                  {TOKENS.map(token => (
                    <button
                      key={token.id}
                      className="quick-mint-card"
                      style={{ '--tok-color': token.color, '--tok-glow': token.glow }}
                      onClick={() => { setMintId(String(token.id)); setMintAmt(token.type === 'fungible' ? '100' : '1'); }}
                    >
                      <span className="qm-emoji">{token.emoji}</span>
                      <span className="qm-name">{token.name}</span>
                      <span className="qm-tag">{token.type === 'nft-prize' ? '🏆 NFT Prize' : token.type === 'nft' ? '⚔️ NFT' : '🔢 Fungible'}</span>
                    </button>
                  ))}
                </div>

                {/* Custom mint form */}
                <div className="form-row mt-2">
                  <select id="mint-token-select" className="form-select" value={mintId} onChange={e => setMintId(e.target.value)}>
                    {TOKENS.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}
                  </select>
                  <input
                    id="mint-amount-input"
                    type="number"
                    className="form-input w-sm"
                    placeholder="Amount"
                    min="1"
                    value={mintAmt}
                    onChange={e => setMintAmt(e.target.value)}
                  />
                  <button id="mint-btn" className="btn-primary" onClick={handleMint}>⚒️ Mint</button>
                </div>

                <div className="divider"><span>or</span></div>

                <div className="batch-mint-row">
                  <div className="batch-mint-info">
                    <strong>mintBatch()</strong>
                    <span>Mint 500 Gold + 25 Shield in one transaction</span>
                  </div>
                  <button id="mint-batch-btn" className="btn-secondary" onClick={handleMintBatch}>⚒️ Mint Batch</button>
                </div>
              </div>
            )}

            {/* ── TRANSFER TAB ── */}
            {activeTab === 'transfer' && (
              <div className="tab-pane" id="tab-transfer">
                <h3 className="tab-title">Transfer Token</h3>
                <p className="tab-desc">Uses <code>safeTransferFrom()</code> to send a single token type to any address.</p>

                {/* Quick-fill with target */}
                <button
                  className="quick-fill-btn"
                  onClick={() => setTfTo(TARGET_ADDRESS)}
                >
                  📋 Use Assessment Target: {shortAddr(TARGET_ADDRESS)}
                </button>

                <div className="form-col">
                  <div className="form-row">
                    <select id="tf-token-select" className="form-select" value={tfId} onChange={e => setTfId(e.target.value)}>
                      {TOKENS.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.emoji} {t.name}  (Balance: {balances[t.id] ?? 0})
                        </option>
                      ))}
                    </select>
                    <input
                      id="tf-amount-input"
                      type="number"
                      className="form-input w-sm"
                      placeholder="Amount"
                      min="1"
                      value={tfAmt}
                      onChange={e => setTfAmt(e.target.value)}
                    />
                  </div>
                  <input
                    id="tf-to-input"
                    type="text"
                    className="form-input"
                    placeholder="Recipient address (0x…)"
                    value={tfTo}
                    onChange={e => setTfTo(e.target.value)}
                  />
                  <button id="transfer-btn" className="btn-primary w-full" onClick={handleTransfer}>
                    ↗️ safeTransferFrom
                  </button>
                </div>
              </div>
            )}

            {/* ── BATCH TRANSFER TAB ── */}
            {activeTab === 'batch' && (
              <div className="tab-pane" id="tab-batch">
                <h3 className="tab-title">Batch Transfer</h3>
                <p className="tab-desc">Uses <code>safeBatchTransferFrom()</code> to send multiple token types in one transaction.</p>

                <button
                  className="quick-fill-btn"
                  onClick={() => setBatchTo(TARGET_ADDRESS)}
                >
                  📋 Use Assessment Target: {shortAddr(TARGET_ADDRESS)}
                </button>

                <div className="form-col">
                  <input
                    id="batch-to-input"
                    type="text"
                    className="form-input"
                    placeholder="Recipient address (0x…)"
                    value={batchTo}
                    onChange={e => setBatchTo(e.target.value)}
                  />

                  <div className="batch-rows">
                    {batchRows.map((row, i) => (
                      <div key={i} className="batch-row">
                        <select
                          className="form-select"
                          value={row.id}
                          onChange={e => updateBatchRow(i, 'id', e.target.value)}
                        >
                          {TOKENS.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.emoji} {t.name}  (bal: {balances[t.id] ?? 0})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          className="form-input w-sm"
                          placeholder="Amt"
                          min="1"
                          value={row.amount}
                          onChange={e => updateBatchRow(i, 'amount', e.target.value)}
                        />
                        {batchRows.length > 1 && (
                          <button className="btn-remove" onClick={() => removeBatchRow(i)} title="Remove row">✕</button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button className="btn-ghost" onClick={addBatchRow}>+ Add Token</button>
                  <button id="batch-transfer-btn" className="btn-primary w-full" onClick={handleBatchTransfer}>
                    📦 safeBatchTransferFrom
                  </button>
                </div>
              </div>
            )}

            {/* ── QUERY TAB ── */}
            {activeTab === 'query' && (
              <div className="tab-pane" id="tab-query">
                <h3 className="tab-title">Query Player Inventory</h3>
                <p className="tab-desc">Look up token balances for any wallet address using <code>balanceOfBatch()</code>.</p>

                <button
                  className="quick-fill-btn"
                  onClick={() => setQueryAddr(TARGET_ADDRESS)}
                >
                  📋 Check Assessment Target: {shortAddr(TARGET_ADDRESS)}
                </button>

                <div className="form-row">
                  <input
                    id="query-addr-input"
                    type="text"
                    className="form-input"
                    placeholder="Enter wallet address (0x…)"
                    value={queryAddr}
                    onChange={e => setQueryAddr(e.target.value)}
                  />
                  <button
                    id="query-btn"
                    className="btn-primary"
                    onClick={handleQuery}
                    disabled={isQuerying}
                  >
                    {isQuerying ? '🔍 Searching…' : '🔍 Query'}
                  </button>
                </div>

                {queryResult && (
                  <div className="query-results animate-in">
                    <div className="query-addr-row">
                      <span className="ci-label">Address</span>
                      <code className="query-addr-code">{queryResult.address}</code>
                    </div>
                    <div className="query-grid">
                      {TOKENS.map(token => (
                        <div
                          key={token.id}
                          className="query-card"
                          style={{ '--tok-color': token.color, '--tok-glow': token.glow }}
                        >
                          <span className="qc-emoji">{token.emoji}</span>
                          <span className="qc-value">{queryResult.inv[token.id]}</span>
                          <span className="qc-name">{token.name} (ID: {token.id})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── Transaction History ── */}
        {txHistory.length > 0 && (
          <section className="tx-section glass" aria-label="Transaction History">
            <div className="panel-header">
              <span className="panel-icon">📜</span>
              <h2>Transaction History</h2>
            </div>
            <div className="tx-list">
              {txHistory.map((tx, i) => (
                <div key={i} className="tx-row animate-in">
                  <span className="tx-label">{tx.label}</span>
                  <span className="tx-time">{tx.time}</span>
                  <a
                    href={`${ETHERSCAN}/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-hash"
                    title="View on Etherscan"
                  >
                    {tx.hash.slice(0, 14)}…{tx.hash.slice(-8)} ↗
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ── Status Toast ── */}
      {status && (
        <div className={`toast toast-${status.type}`} role="alert">
          {status.msg}
          {status.type === 'loading' && <span className="toast-spinner" />}
        </div>
      )}
    </div>
  );
}
