import { getFileIcon, getFileTypeBadge, formatBytes } from '../ipfsService'

export default function HistoryTab({ history, setHistory }) {
  const clearHistory = () => { if (confirm('Clear all history?')) setHistory([]) }
  const removeEntry = (id) => setHistory(prev => prev.filter(h => h.id !== id))
  const copyToClipboard = (text) => navigator.clipboard.writeText(text)

  if (history.length === 0) return (
    <div className="card">
      <div className="empty-state">
        <div className="empty-icon">◷</div>
        <p>No uploads yet. Upload a file or JSON to see it here.</p>
      </div>
    </div>
  )

  return (
    <div className="card">
      <div className="section-header">
        <div className="section-title">◷ Local Operation Logs <span className="badge badge-blue">{history.length}</span></div>
        <button className="btn btn-ghost btn-sm" onClick={clearHistory}>🗑️ Clear All</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="history-table">
          <thead>
            <tr>
              <th>File</th>
              <th>Type</th>
              <th>CID</th>
              <th>Size</th>
              <th>Encrypted</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {history.map(h => {
              const badge = getFileTypeBadge(h.mimeType)
              return (
                <tr key={h.id}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{getFileIcon(h.mimeType)}</span>
                    <span style={{ fontWeight: 500, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</span>
                  </td>
                  <td><span className={`badge ${badge.class}`}>{badge.label}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--accent-3)' }}>
                        {h.cid?.slice(0, 16)}...
                      </span>
                      <button className="copy-btn" onClick={() => copyToClipboard(h.cid)} title="Copy CID">⬡</button>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{h.size ? formatBytes(h.size) : '—'}</td>
                  <td>{h.encrypted ? <span className="badge badge-purple">⚿ Yes</span> : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No</span>}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    {new Date(h.uploadedAt).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <a href={h.gatewayUrl || `http://127.0.0.1:8080/ipfs/${h.cid}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">⍐</a>
                      <button className="btn btn-ghost btn-sm" onClick={() => removeEntry(h.id)}>✕</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
