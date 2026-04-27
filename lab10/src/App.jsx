import { useState, useEffect } from 'react';
import './index.css';
import UploadTab from './components/UploadTab';
import RetrieveTab from './components/RetrieveTab';
import HistoryTab from './components/HistoryTab';

import BlockchainTab from './components/BlockchainTab';
import Toast from './components/Toast';
import { connectWallet } from './blockchainService';

const TABS = [
  { id: 'upload', label: 'Upload', icon: '⬆️' },
  { id: 'retrieve', label: 'Retrieve', icon: '⬇️' },
  { id: 'history', label: 'History', icon: '📋' },

  { id: 'blockchain', label: 'Blockchain', icon: '⛓️' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ipfs_history') || '[]'); }
    catch { return []; }
  });
  const [toasts, setToasts] = useState([]);
  const [wallet, setWallet] = useState(null);

  const handleConnectWallet = async () => {
    try {
      const w = await connectWallet();
      setWallet(w);
      toast(`Wallet connected: ${w.address.slice(0, 6)}...${w.address.slice(-4)}`, 'success');
    } catch (err) {
      toast(err.message || 'Failed to connect wallet', 'error');
    }
  };

  const handleSwitchWallet = async () => {
    try {
      if (window.ethereum) {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
      }
      const w = await connectWallet();
      setWallet(w);
      toast(`Switched to: ${w.address.slice(0, 6)}...${w.address.slice(-4)}`, 'success');
    } catch (err) {
      if (err.code === 4001) return; // User rejected request
      toast(err.message || 'Failed to switch wallet', 'error');
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = async (accounts) => {
        if (accounts.length > 0) {
          try {
            const w = await connectWallet();
            setWallet(w);
          } catch (e) {
            console.error('Auto-reconnect failed', e);
          }
        } else {
          setWallet(null);
        }
      };
      
      const handleChainChanged = () => window.location.reload();

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ipfs_history', JSON.stringify(history));
  }, [history]);

  const addToHistory = (entry) => {
    setHistory(prev => [{ ...entry, timestamp: new Date().toISOString() }, ...prev].slice(0, 50));
  };

  const toast = (msg, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const stats = {
    uploaded: history.length,
    pinned: history.filter(h => h.pinned).length,
    encrypted: history.filter(h => h.encrypted).length,
  };

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="app-header">
        <div className="header-badge">
          <span className="dot" /> IPFS Decentralized Storage
        </div>
        <h1 className="app-title">🌐 DecentraStore</h1>
        <p className="app-subtitle">
          Upload, pin &amp; retrieve files on IPFS with optional AES-256 encryption. CIDs are stored on the Sepolia Blockchain!
        </p>

        {!wallet ? (
          <button className="btn btn-primary" onClick={handleConnectWallet} style={{ marginTop: '16px' }}>
            🔗 Connect Wallet to Store CIDs On-Chain
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div className="header-badge" style={{ margin: 0, background: 'rgba(16, 185, 129, 0.2)', color: 'var(--green)', borderColor: 'var(--green)' }}>
              ✅ Connected: {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={handleSwitchWallet} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
              🔄 Switch Wallet
            </button>
          </div>
        )}
      </header>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-value">{stats.uploaded}</span>
          <span className="stat-label">Files Uploaded</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.pinned}</span>
          <span className="stat-label">Pinned</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.encrypted}</span>
          <span className="stat-label">Encrypted</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: 'var(--teal)' }}>IPFS</span>
          <span className="stat-label">Network</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="fade-in" key={activeTab}>
        {activeTab === 'upload' && <UploadTab addToHistory={addToHistory} toast={toast} wallet={wallet} />}
        {activeTab === 'retrieve' && <RetrieveTab history={history} toast={toast} wallet={wallet} />}
        {activeTab === 'history' && <HistoryTab history={history} setHistory={setHistory} toast={toast} setActiveTab={setActiveTab} />}

        {activeTab === 'blockchain' && <BlockchainTab toast={toast} wallet={wallet} />}
      </div>

      {/* Toasts */}
      <Toast toasts={toasts} />
    </div>
  );
}
