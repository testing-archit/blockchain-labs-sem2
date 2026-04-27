import { useState, useEffect } from 'react'
import UploadTab from './components/UploadTab'
import JsonTab from './components/JsonTab'
import RetrieveTab from './components/RetrieveTab'
import HistoryTab from './components/HistoryTab'
import VaultTab from './components/VaultTab'
import CombinedTab from './components/CombinedTab'
import ConceptsTab from './components/ConceptsTab'
import { connectWallet } from './ethersService'

const TABS = [
  { id: 'json', label: 'Data Nodes', icon: '⬡' },
  { id: 'upload', label: 'Asset Sync', icon: '⎈' },
  { id: 'combined', label: 'Batch Publish', icon: '⚄' },
  { id: 'retrieve', label: 'Fetch Gateway', icon: '⌕' },
  { id: 'vault', label: 'Ledger Records', icon: '⌘' },
  { id: 'history', label: 'Local Logs', icon: '◷' },
  { id: 'concepts', label: 'Knowledge Base', icon: '✧' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('json')
  const [wallet, setWallet] = useState('')
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ipfs_history') || '[]') } catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem('ipfs_history', JSON.stringify(history))
  }, [history])

  const addToHistory = (entry) => {
    setHistory(prev => [{ ...entry, id: Date.now(), uploadedAt: new Date().toISOString() }, ...prev].slice(0, 50))
  }

  const handleConnect = async () => {
    try {
      const res = await connectWallet()
      setWallet(res.address)
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div className="app-container">
      <nav className="top-navbar">
        <div className="brand-logo">
          <div className="brand-mark"></div>
          NexusCloud Protocol
        </div>
        <div className="nav-controls">
          {wallet ? (
            <div className="wallet-badge active-wallet">
              <span className="wallet-icon">◈</span> {wallet.slice(0,6)}...{wallet.slice(-4)}
            </div>
          ) : (
            <button className="btn-action primary-action" onClick={handleConnect}>
              Connect Network
            </button>
          )}
          <span className="user-identifier">
            Node: Archit Gupta [S24CSEU1049]
          </span>
          <div className="status-indicator">
            <div className="pulse-dot" /> Online
          </div>
        </div>
      </nav>

      <div className="main-wrapper">
        <header className="hero-section">
          <h1 className="hero-headline">Distributed Data Mesh <span className="highlight">Architecture</span></h1>
          <p className="hero-subtext">Securely synchronize, cryptographically sign, and query your immutable assets across the global peer-to-peer network.</p>
          <div className="metrics-bar">
            <div className="metric-item">⬡ <strong>IPFS</strong> Backbone</div>
            <div className="metric-item">✦ <strong>Pinata</strong> Gateway</div>
            <div className="metric-item">⚿ <strong>AES-256</strong> Shield</div>
            <div className="metric-item">◷ <strong>{history.length}</strong> Objects Synced</div>
          </div>
        </header>

        <nav className="tab-navigation">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`nav-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="tab-icon">{t.icon}</span> {t.label}
            </button>
          ))}
        </nav>

        <section className="content-pane">
          {activeTab === 'json' && <JsonTab onUpload={addToHistory} walletConnected={!!wallet} />}
          {activeTab === 'upload' && <UploadTab onUpload={addToHistory} walletConnected={!!wallet} />}
          {activeTab === 'combined' && <CombinedTab onUpload={addToHistory} walletConnected={!!wallet} />}
          {activeTab === 'retrieve' && <RetrieveTab history={history} />}
          {activeTab === 'vault' && <VaultTab walletConnected={!!wallet} />}
          {activeTab === 'history' && <HistoryTab history={history} setHistory={setHistory} />}
          {activeTab === 'concepts' && <ConceptsTab />}
        </section>
      </div>
    </div>
  )
}
