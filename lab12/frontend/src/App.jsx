import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, 
  Send, 
  RefreshCcw, 
  User, 
  Tag, 
  CircleDollarSign, 
  Activity,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Search,
  Network,
  History,
  ShieldCheck,
  Server
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function App() {
  const [assets, setAssets] = useState([]);
  const [singleAsset, setSingleAsset] = useState(null);
  const [searchId, setSearchId] = useState('');
  const [txHistory, setTxHistory] = useState([]);
  const [networkInfo, setNetworkInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', visible: false });
  const [transferData, setTransferData] = useState({ assetId: '', newOwner: '' });
  
  // Configuration State
  const [activeOrg, setActiveOrg] = useState('Org1');
  const [activeChannel, setActiveChannel] = useState('archit');

  const showToast = (message, type) => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast({ message: '', type: '', visible: false }), 5000);
  };

  const fetchNetworkInfo = async () => {
    try {
      const response = await axios.get(`${API_BASE}/info`, {
        params: { org: activeOrg, channel: activeChannel }
      });
      setNetworkInfo(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/assets`, {
        params: { org: activeOrg, channel: activeChannel }
      });
      setAssets(Array.isArray(response.data) ? response.data : []);
      fetchHistory();
      fetchNetworkInfo();
      // Clear single asset search when refreshing all
      setSingleAsset(null); 
    } catch (err) {
      showToast('Failed to fetch assets. Check backend connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleAsset = async (e) => {
    e.preventDefault();
    if (!searchId) return;
    setLoading(true);
    setSingleAsset(null);
    try {
      const response = await axios.get(`${API_BASE}/asset/${searchId}`, {
        params: { org: activeOrg, channel: activeChannel }
      });
      setSingleAsset(response.data);
      showToast(`Asset ${searchId} retrieved`, 'success');
    } catch (err) {
      showToast(`Failed to find asset ${searchId}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE}/history`);
      setTxHistory(response.data);
    } catch (err) {
      console.error('History fetch error', err);
    }
  };

  const initLedger = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/init`, { org: activeOrg, channel: activeChannel });
      showToast(res.data.message || 'Ledger Initialized Successfully!', 'success');
      fetchAssets();
    } catch (err) {
      showToast('Failed to initialize ledger.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!transferData.assetId || !transferData.newOwner) return;
    
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/transfer`, {
        ...transferData,
        org: activeOrg,
        channel: activeChannel
      });
      showToast(`Transfer Success! TxID: ${res.data.txId.substring(0,8)}...`, 'success');
      setTransferData({ assetId: '', newOwner: '' });
      fetchAssets();
    } catch (err) {
      showToast('Transfer failed. Please check asset ID and permissions.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [activeOrg, activeChannel]);

  return (
    <div className="app-container">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}
          >
            {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Configuration Bar */}
      <div className="config-bar glass-card">
        <div className="config-item">
          <label>Organization</label>
          <div className="toggle-group">
            <button 
              className={`toggle-btn ${activeOrg === 'Org1' ? 'active' : ''}`}
              onClick={() => setActiveOrg('Org1')}
            >
              Org1
            </button>
            <button 
              className={`toggle-btn ${activeOrg === 'Org2' ? 'active' : ''}`}
              onClick={() => setActiveOrg('Org2')}
            >
              Org2
            </button>
          </div>
        </div>
        
        <div className="config-item">
          <label>Channel</label>
          <select 
            className="dropdown-select" 
            value={activeChannel} 
            onChange={(e) => setActiveChannel(e.target.value)}
          >
            <option value="archit">archit (Default)</option>
            <option value="c1">c1</option>
            <option value="c2">c2</option>
          </select>
        </div>
      </div>

      <header className="app-header">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="header-title-container"
        >
          <Database className="header-icon" />
          <h1 className="gradient-text">Fabric Explorer</h1>
        </motion.div>
      </header>

      {/* Network Info Panel */}
      <div className="network-info-panel glass-card mb-8">
         <div className="info-badge">
            <Network size={16} /> Channel: <strong>{networkInfo.channel || activeChannel}</strong>
         </div>
         <div className="info-badge">
            <ShieldCheck size={16} /> Chaincode: <strong>{networkInfo.chaincode || '...'}</strong>
         </div>
         <div className="info-badge">
            <Server size={16} /> Connected Peer: <strong>{networkInfo.peer || '...'}</strong>
         </div>
      </div>

      <div className="main-grid">
        {/* Left Side: Actions */}
        <section className="side-panel">
          <motion.div className="glass-card">
            <h2 className="card-title controls">
              <Activity size={24} /> Actions
            </h2>
            <div className="button-group">
              <button onClick={fetchAssets} disabled={loading} className="btn btn-primary">
                <RefreshCcw size={18} className={loading ? 'spin' : ''} />
                Refresh Ledger
              </button>
              <button onClick={initLedger} disabled={loading} className="btn btn-secondary">
                <PlusCircle size={18} />
                Initialize Assets
              </button>
            </div>
          </motion.div>

          <motion.div className="glass-card">
            <h2 className="card-title transfer">
              <Send size={24} /> Transfer Asset
            </h2>
            <form onSubmit={handleTransfer}>
              <div className="form-group">
                <label className="form-label">Asset ID</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="e.g. asset6"
                  value={transferData.assetId}
                  onChange={e => setTransferData({...transferData, assetId: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Owner</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="e.g. Alice"
                  value={transferData.newOwner}
                  onChange={e => setTransferData({...transferData, newOwner: e.target.value})}
                />
              </div>
              <button type="submit" disabled={loading} className="btn btn-success">
                Execute Transfer
              </button>
            </form>
          </motion.div>

          <motion.div className="glass-card">
            <h2 className="card-title controls">
              <Search size={24} /> Query Asset
            </h2>
            <form onSubmit={fetchSingleAsset} className="flex-form">
              <input 
                type="text" 
                className="form-input"
                placeholder="Asset ID..."
                value={searchId}
                onChange={e => setSearchId(e.target.value)}
              />
              <button type="submit" disabled={loading} className="btn btn-primary mt-2">
                Fetch
              </button>
            </form>
            
            <AnimatePresence>
              {singleAsset && (
                <motion.div 
                  initial={{opacity: 0, height: 0}}
                  animate={{opacity: 1, height: 'auto'}}
                  className="single-asset-result mt-4"
                >
                  <div className="asset-header">
                      <span className="asset-id">{singleAsset.ID}</span>
                      <div className="asset-color"><Tag size={12}/>{singleAsset.Color}</div>
                  </div>
                  <div className="asset-owner mt-2">
                      <User size={16} /> {singleAsset.Owner}
                  </div>
                  <div className="asset-details mt-2 text-sm text-slate-400">
                      Size: {singleAsset.Size} • Value: ${singleAsset.AppraisedValue}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* Right Side: Ledger & History */}
        <section className="side-panel">
          <motion.div className="glass-card">
            <h2 className="card-title ledger">
              <CircleDollarSign size={28} /> Live Assets
            </h2>
            <div className="assets-container">
              <AnimatePresence>
                {assets.map((asset, index) => (
                  <motion.div
                    key={asset.ID}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="asset-card"
                  >
                    <div className="asset-header">
                      <span className="asset-id">{asset.ID}</span>
                      <div className="asset-color"><Tag size={14} />{asset.Color}</div>
                    </div>
                    <div className="asset-body">
                      <div className="asset-owner"><User size={20} />{asset.Owner}</div>
                      <div className="asset-details">
                        <span>Size: {asset.Size}</span>
                        <span className="asset-separator">•</span>
                        <span>Value: ${asset.AppraisedValue}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {!loading && assets.length === 0 && (
                <div className="empty-state">No assets found on channel {activeChannel}.</div>
              )}
            </div>
          </motion.div>

          <motion.div className="glass-card">
            <h2 className="card-title controls">
              <History size={24} /> Recent Transactions
            </h2>
            <div className="history-list">
              {txHistory.length === 0 ? (
                <div className="text-slate-400 text-center py-4 text-sm">No recent transactions recorded in this session.</div>
              ) : (
                txHistory.map((tx, idx) => (
                  <div key={idx} className={`history-item ${tx.status === 'FAILED' ? 'failed' : ''}`}>
                    <div className="history-header">
                      <span className="history-type">{tx.type}</span>
                      <span className="history-time">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="history-txid">TxID: {tx.txId}</div>
                    <div className="history-meta">
                      <span>Org: {tx.org}</span>
                      <span>Channel: {tx.channel}</span>
                    </div>
                    {tx.endorsedBy && (
                      <div className="history-endorsement">
                        <ShieldCheck size={12} /> Endorsed by: {tx.endorsedBy.join(', ')}
                      </div>
                    )}
                    {tx.error && <div className="history-error">{tx.error}</div>}
                  </div>
                ))
              )}
            </div>
          </motion.div>

        </section>
      </div>
    </div>
  );
}

export default App;
