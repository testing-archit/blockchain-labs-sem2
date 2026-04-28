import { useState, useEffect } from 'react';
import { Box, Activity, Plus, RefreshCw, Send, Trash2, Database, ShieldCheck, AlertCircle, X } from 'lucide-react';
import './App.css';

const API_URL = 'http://localhost:3001/api';

function App() {
  const [assets, setAssets] = useState([]);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [txLog, setTxLog] = useState([]);
  const [health, setHealth] = useState({ status: 'checking' });
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Form states
  const [createForm, setCreateForm] = useState({ id: '', color: '', size: '', owner: '', appraisedValue: '' });
  const [transferForm, setTransferForm] = useState({ newOwner: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assetsRes, infoRes, healthRes, txRes] = await Promise.all([
        fetch(`${API_URL}/assets`),
        fetch(`${API_URL}/network`),
        fetch(`${API_URL}/health`),
        fetch(`${API_URL}/txlog`)
      ]);
      
      if (assetsRes.ok) setAssets(await assetsRes.json());
      if (infoRes.ok) setNetworkInfo(await infoRes.json());
      if (healthRes.ok) setHealth(await healthRes.json());
      if (txRes.ok) setTxLog(await txRes.json());
    } catch (err) {
      setHealth({ status: 'error', error: err.message });
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // Poll for tx log updates
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/txlog`);
        if (res.ok) setTxLog(await res.json());
      } catch (e) {}
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleInitLedger = async () => {
    setLoading(true);
    try {
      await fetch(`${API_URL}/ledger/init`, { method: 'POST' });
      await fetchData();
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      });
      setIsCreateModalOpen(false);
      setCreateForm({ id: '', color: '', size: '', owner: '', appraisedValue: '' });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/assets/${selectedAsset}/transfer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferForm)
      });
      setIsTransferModalOpen(false);
      setTransferForm({ newOwner: '' });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!confirm(`Are you sure you want to delete asset ${id}?`)) return;
    try {
      await fetch(`${API_URL}/assets/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const openTransferModal = (id) => {
    setSelectedAsset(id);
    setIsTransferModalOpen(true);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header glass-panel animate-fade-in">
        <div className="header-title">
          <Database size={32} color="var(--primary-color)" />
          <h1>Hyperledger Fabric Explorer</h1>
        </div>
        <div className="header-info">
          {health.status === 'connected' ? (
            <div className="status-badge">
              <span className="status-dot"></span>
              Live: Channel {health.channel}
            </div>
          ) : (
            <div className="status-badge error">
              <AlertCircle size={16} />
              {health.status === 'checking' ? 'Connecting...' : 'Disconnected'}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="dashboard-grid">
        
        {/* Left Column: Assets */}
        <div className="main-content">
          <div className="glass-panel panel animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="header" style={{ padding: '0 0 1.5rem 0' }}>
              <h2 className="section-title" style={{ margin: 0 }}>
                <Box size={24} /> World State Assets
              </h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-outline" onClick={handleInitLedger}>
                  <RefreshCw size={18} /> Init Ledger
                </button>
                <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                  <Plus size={18} /> New Asset
                </button>
              </div>
            </div>

            {loading && assets.length === 0 ? (
              <div className="empty-state">
                <RefreshCw size={48} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                <p>Syncing with ledger...</p>
              </div>
            ) : assets.length === 0 ? (
              <div className="empty-state">
                <Box size={48} />
                <h3>No Assets Found</h3>
                <p>The ledger is currently empty. Initialize it or create a new asset.</p>
              </div>
            ) : (
              <div className="assets-grid">
                {assets.map((asset, i) => (
                  <div className="asset-card animate-fade-in" style={{ animationDelay: `${0.1 + (i * 0.05)}s` }} key={asset.ID}>
                    <div className="asset-header">
                      <span className="asset-id">{asset.ID}</span>
                      <span className="asset-value">${asset.AppraisedValue}</span>
                    </div>
                    <div className="asset-details">
                      <div className="detail-row">
                        <span className="detail-label">Owner</span>
                        <span className="detail-value">{asset.Owner}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Color</span>
                        <span className="detail-value" style={{ textTransform: 'capitalize' }}>
                          <span style={{ 
                            display: 'inline-block', 
                            width: '12px', height: '12px', 
                            borderRadius: '50%', 
                            backgroundColor: asset.Color,
                            marginRight: '6px',
                            border: '1px solid #fff'
                          }}></span>
                          {asset.Color}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Size</span>
                        <span className="detail-value">{asset.Size} units</span>
                      </div>
                    </div>
                    <div className="asset-actions">
                      <button className="btn btn-outline" onClick={() => openTransferModal(asset.ID)}>
                        <Send size={16} /> Transfer
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(asset.ID)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Network & Logs */}
        <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="glass-panel panel animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h2 className="section-title">
              <ShieldCheck size={24} /> Network Config
            </h2>
            {networkInfo ? (
              <div className="asset-details" style={{ margin: 0 }}>
                <div className="detail-row">
                  <span className="detail-label">Channel</span>
                  <span className="detail-value">{networkInfo.channel}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Chaincode</span>
                  <span className="detail-value">{networkInfo.chaincode}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Organization</span>
                  <span className="detail-value">{networkInfo.mspId}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Peer</span>
                  <span className="detail-value" style={{ fontSize: '0.85rem' }}>{networkInfo.peerAlias}</span>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
            )}
          </div>

          <div className="glass-panel panel animate-fade-in" style={{ animationDelay: '0.3s', flex: 1 }}>
            <h2 className="section-title">
              <Activity size={24} /> Transaction Log
            </h2>
            <div className="tx-log">
              {txLog.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>No recent transactions</p>
              ) : (
                txLog.map((tx) => (
                  <div key={tx.id} className={`tx-item ${tx.error ? 'error' : ''}`}>
                    <div className="tx-header">
                      <span className="tx-type">{tx.type}</span>
                      <span className="tx-time">{tx.durationMs}ms</span>
                    </div>
                    <div className="tx-func">{tx.function}()</div>
                    <div className="tx-args">{JSON.stringify(tx.args)}</div>
                    {tx.error && <div className="tx-args" style={{ color: 'var(--danger-color)', marginTop: '0.5rem' }}>{tx.error}</div>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h2 className="section-title" style={{ margin: 0 }}>Create New Asset</h2>
              <button className="close-btn" onClick={() => setIsCreateModalOpen(false)}><X size={24}/></button>
            </div>
            <form onSubmit={handleCreateAsset}>
              <div className="form-group">
                <label>Asset ID</label>
                <input required type="text" className="form-control" placeholder="e.g. asset7" 
                  value={createForm.id} onChange={e => setCreateForm({...createForm, id: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Color</label>
                  <input required type="text" className="form-control" placeholder="e.g. purple" 
                    value={createForm.color} onChange={e => setCreateForm({...createForm, color: e.target.value})} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Size</label>
                  <input required type="number" className="form-control" placeholder="e.g. 10" 
                    value={createForm.size} onChange={e => setCreateForm({...createForm, size: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Owner</label>
                <input required type="text" className="form-control" placeholder="e.g. Alice" 
                  value={createForm.owner} onChange={e => setCreateForm({...createForm, owner: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Appraised Value ($)</label>
                <input required type="number" className="form-control" placeholder="e.g. 1000" 
                  value={createForm.appraisedValue} onChange={e => setCreateForm({...createForm, appraisedValue: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Create Asset
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h2 className="section-title" style={{ margin: 0 }}>Transfer {selectedAsset}</h2>
              <button className="close-btn" onClick={() => setIsTransferModalOpen(false)}><X size={24}/></button>
            </div>
            <form onSubmit={handleTransfer}>
              <div className="form-group">
                <label>New Owner Name</label>
                <input required type="text" className="form-control" placeholder="e.g. Bob" 
                  value={transferForm.newOwner} onChange={e => setTransferForm({newOwner: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Execute Transfer
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
