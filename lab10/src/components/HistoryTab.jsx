export default function HistoryTab({ history, setHistory, toast, setActiveTab }) {
  const formatTime = (iso) => {
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  };

  const formatBytes = (b) => {
    if (!b) return '—';
    b = parseInt(b);
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b/1024).toFixed(1)} KB`;
    return `${(b/1048576).toFixed(2)} MB`;
  };

  const copyText = (t) => { navigator.clipboard.writeText(t); toast('Copied!', 'info'); };

  const openGateway = (cid) => window.open(`https://ipfs.io/ipfs/${cid}`, '_blank');

  const removeItem = (i) => {
    setHistory(prev => prev.filter((_, idx) => idx !== i));
    toast('Removed from history', 'info');
  };

  const clearAll = () => {
    setHistory([]);
    toast('History cleared', 'info');
  };

  return (
    <div className="card">
      <div className="card-title" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="icon-badge purple">📋</div>
          Upload History ({history.length})
        </div>
        {history.length > 0 && (
          <button className="btn btn-danger btn-sm" onClick={clearAll}>🗑️ Clear All</button>
        )}
      </div>

      {history.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>No uploads yet. Upload a file to see it here.</p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => setActiveTab('upload')}>
            ⬆️ Go to Upload
          </button>
        </div>
      )}

      <div className="history-list">
        {history.map((item, i) => (
          <div key={i} className="history-item">
            <span className="hist-icon">{(() => {
              const n = item.name || '';
              const ext = n.replace(/\.enc$/, '').split('.').pop().toLowerCase();
              if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return '🖼️';
              if (ext === 'pdf') return '📕';
              if (['mp4','webm','mov'].includes(ext)) return '🎬';
              if (['mp3','wav','ogg'].includes(ext)) return '🎵';
              if (ext === 'json') return '📄';
              if (['zip','tar','gz','rar'].includes(ext)) return '🗜️';
              if (['doc','docx','xls','xlsx','ppt'].includes(ext)) return '📊';
              return '📦';
            })()}</span>
            <div className="hist-info">
              <div className="hist-name">{item.name}</div>
              <div className="hist-cid" title={item.cid}>{item.cid}</div>
              <div className="hist-meta">
                {formatTime(item.timestamp)} &nbsp;·&nbsp; {formatBytes(item.size)}
                {item.pinned && <> &nbsp;·&nbsp; <span style={{ color: 'var(--green)' }}>📌 Pinned</span></>}
                {item.encrypted && <> &nbsp;·&nbsp; <span style={{ color: 'var(--amber)' }}>🔐 Encrypted</span></>}
              </div>
            </div>
            <div className="hist-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => copyText(item.cid)} title="Copy CID">
                📋 CID
              </button>
              <button className="btn btn-teal btn-sm" onClick={() => openGateway(item.cid)} title="Open in gateway">
                🌐
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => removeItem(i)} title="Remove">
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
