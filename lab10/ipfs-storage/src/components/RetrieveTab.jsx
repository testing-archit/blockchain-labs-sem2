import { useState } from 'react'
import { retrieveFromIPFS, getGatewayUrl } from '../ipfsService'
import CidDisplay from './CidDisplay'

export default function RetrieveTab({ history }) {
  const [cid, setCid] = useState('')
  const [decrypt, setDecrypt] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleRetrieve = async () => {
    if (!cid.trim()) { setError('Enter a CID'); return }
    setError(''); setResult(null); setLoading(true)
    try {
      const res = await retrieveFromIPFS(cid.trim(), decrypt, password)
      setResult(res)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const loadFromHistory = (entry) => {
    setCid(entry.cid)
    setResult(null); setError('')
  }

  const isImage = result?.contentType?.startsWith('image/')
  const isPDF = result?.contentType === 'application/pdf'
  const isJSON = result?.contentType?.includes('json') || (typeof result?.content === 'object')

  const srcUrl = typeof result?.content === 'string' && result?.content?.startsWith('data:') 
    ? result.content 
    : getGatewayUrl(cid)

  return (
    <div className="grid-2" style={{ alignItems: 'start' }}>
      <div>
        <div className="card">
          <div className="card-title"><span className="icon">⌕</span> Query Distributed Mesh</div>

          <label>Cryptographic Hash (CID)</label>
          <div className="retrieve-input-row">
            <input
              type="text"
              value={cid}
              onChange={e => setCid(e.target.value)}
              placeholder="Qm... or bafy..."
              onKeyDown={e => e.key === 'Enter' && handleRetrieve()}
            />
            <button className="btn btn-primary" onClick={handleRetrieve} disabled={loading}>
              {loading ? <div className="spinner" /> : '⌕'}
            </button>
          </div>

          <div className="toggle-row">
            <div>
              <div className="toggle-label">⚿ Decrypt Content</div>
              <div className="toggle-desc">If file was encrypted on upload</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={decrypt} onChange={e => setDecrypt(e.target.checked)} />
              <span className="toggle-slider" />
            </label>
          </div>

          {decrypt && (
            <>
              <label>Decryption Password</label>
              <input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password used during upload" />
            </>
          )}

          {error && <div className="alert alert-error">✕ {error}</div>}

          {/* Quick load from history */}
          {history.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <label>Quick Load from History</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '200px', overflowY: 'auto' }}>
                {history.slice(0, 8).map(h => (
                  <button key={h.id} className="btn btn-ghost btn-sm" onClick={() => loadFromHistory(h)}
                    style={{ justifyContent: 'flex-start', textAlign: 'left', fontFamily: 'monospace', fontSize: '0.75rem' }}
                  >
                    ⬡ {h.name} — {h.cid.slice(0, 20)}...
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        {result && (
          <div className="card">
            <div className="card-title"><span className="icon">⚄</span> Retrieved Content</div>
            <CidDisplay cid={cid} />

            <div className="retrieved-content" style={{ marginTop: '1rem' }}>
              <div className="retrieved-header">
                <span>{result.name || 'Content'}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{result.contentType || 'unknown'}</span>
              </div>
              <div className="retrieved-body">
                {isImage && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <img src={srcUrl} alt="Retrieved" className="retrieved-img" />
                    <a href={srcUrl} download={`retrieved-${cid.slice(0, 6)}`} className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>
                      ⤓ Download Image
                    </a>
                  </div>
                )}
                {isPDF && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <object data={srcUrl} type="application/pdf" width="100%" height="500px" style={{ borderRadius: '8px', background: 'white' }}>
                      <p>Your browser doesn't support embedded PDFs. <a href={srcUrl} download={`document-${cid.slice(0,6)}.pdf`} style={{ color: 'var(--accent)' }}>Download PDF instead</a></p>
                    </object>
                    <a href={srcUrl} download={`document-${cid.slice(0,6)}.pdf`} className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>
                      ⤓ Download PDF
                    </a>
                  </div>
                )}
                {!isImage && !isPDF && (
                  <pre>{isJSON ? JSON.stringify(result.content, null, 2) : String(result.content || '')}</pre>
                )}
              </div>
            </div>

            {result.decrypted && <div className="alert alert-success" style={{ marginTop: '1rem' }}>🔓 Content successfully decrypted</div>}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <a href={getGatewayUrl(cid)} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">⍐ Gateway</a>
              <a href={`https://ipfs.io/ipfs/${cid}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">⍈ ipfs.io</a>
            </div>
          </div>
        )}
        {!result && !loading && (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">⌕</div>
              <p>Enter a CID above to retrieve content from Mesh</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
