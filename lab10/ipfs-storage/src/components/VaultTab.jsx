import { useState, useEffect } from 'react'
import { getFilesFromChain } from '../ethersService'
import { getFileTypeBadge, formatBytes } from '../ipfsService'

export default function VaultTab({ walletConnected }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchOnChainFiles = async () => {
    if (!walletConnected) return
    setLoading(true); setError('')
    try {
      const data = await getFilesFromChain()
      // Solidity returns an array of tuples. We map them to objects.
      // tuple(string cid, string name, uint256 timestamp, bool encrypted)
      const formatted = data.map(f => ({
        cid: f.cid,
        name: f.name,
        timestamp: Number(f.timestamp) * 1000, // Convert seconds to ms
        encrypted: f.encrypted
      })).reverse() // Show newest first
      setFiles(formatted)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch when tab mounts or wallet connects
  useEffect(() => {
    if (walletConnected) {
      fetchOnChainFiles()
    }
  }, [walletConnected])

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  if (!walletConnected) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-icon">◈</div>
          <p>Please connect your MetaMask wallet to view your on-chain NexusCloud vault.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="section-header">
        <div className="section-title">
          <span className="icon">⌘</span> Ledger Records
          <span className="badge badge-purple">{files.length} Records</span>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchOnChainFiles} disabled={loading}>
          {loading ? '↻ Refreshing...' : '↻ Refresh Chain Data'}
        </button>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
        These records are permanently stored on the Sepolia Ethereum Blockchain. Your smart contract securely maps your wallet address to these NexusCloud Content Identifiers (CIDs).
      </p>

      {error && <div className="alert alert-error">✕ {error}</div>}

      {files.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <p>No records found on the blockchain for your address.</p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Upload a file to NexusCloud and click "Commit Hash to Ledger" to save one.</p>
        </div>
      )}

      {files.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="history-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>CID</th>
                <th>Encryption</th>
                <th>Blockchain Timestamp</th>
                <th>Gateway URL</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{f.name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--accent-3)' }}>
                        {f.cid?.slice(0, 16)}...
                      </span>
                      <button className="copy-btn" onClick={() => copyToClipboard(f.cid)} title="Copy CID">⬡</button>
                    </div>
                  </td>
                  <td>{f.encrypted ? <span className="badge badge-purple">⚿ Encrypted</span> : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Public</span>}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(f.timestamp).toLocaleString()}</td>
                  <td>
                    <a href={`http://127.0.0.1:8080/ipfs/${f.cid}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">⍐ Open Node</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
