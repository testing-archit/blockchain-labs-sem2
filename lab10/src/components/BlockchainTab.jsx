import { useState, useEffect } from 'react';
import { getRecentFiles, getUserFiles } from '../blockchainService';

export default function BlockchainTab({ toast, wallet }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'my'

  const loadFiles = async () => {
    setLoading(true);
    try {
      let data = [];
      if (filter === 'all') {
        data = await getRecentFiles(20);
      } else {
        if (!wallet) throw new Error("Connect your wallet to see your files.");
        data = await getUserFiles(wallet.address);
      }
      setFiles(data);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [filter, wallet]);

  const copyText = (t) => { navigator.clipboard.writeText(t); toast('Copied!', 'info'); };
  const openGateway = (cid) => window.open(`https://ipfs.io/ipfs/${cid}`, '_blank');
  const formatTime = (ts) => new Date(ts * 1000).toLocaleString();

  return (
    <div className="card">
      <div className="card-title" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="icon-badge amber">⛓️</div>
          On-Chain Registry (Sepolia)
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
           <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('all')}>🌍 Global</button>
           <button className={`btn btn-sm ${filter === 'my' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('my')}>👤 My Files</button>
           <button className="btn btn-secondary btn-sm" onClick={loadFiles}>🔄</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /> Loading from Blockchain...</div>
      ) : files.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⛓️</div>
          <p>No files found on the blockchain.</p>
        </div>
      ) : (
        <div className="history-list">
          {files.map((item, i) => (
            <div key={i} className="history-item">
              <span className="hist-icon">🔗</span>
              <div className="hist-info">
                <div className="hist-name">{item.fileName}</div>
                <div className="hist-cid" title={item.cid}>{item.cid}</div>
                <div className="hist-meta">
                  {formatTime(item.timestamp)} &nbsp;·&nbsp; {item.fileSize} B
                  &nbsp;·&nbsp; Uploader: {item.uploader.slice(0,6)}...{item.uploader.slice(-4)}
                  {item.encrypted && <> &nbsp;·&nbsp; <span style={{ color: 'var(--amber)' }}>🔐 Encrypted</span></>}
                </div>
              </div>
              <div className="hist-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => copyText(item.cid)} title="Copy CID">📋</button>
                <button className="btn btn-teal btn-sm" onClick={() => openGateway(item.cid)} title="Open in gateway">🌐</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
