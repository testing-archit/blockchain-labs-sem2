import { useState, useRef } from 'react'
import { uploadFileToIPFS, getGatewayUrl, formatBytes, getFileIcon } from '../ipfsService'
import CidDisplay from './CidDisplay'
import { storeCidOnChain } from '../ethersService'

const ACCEPTED = '.jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.txt,.md,.json,.mp4,.mp3,.zip,.csv,.xlsx,.docx'

export default function UploadTab({ onUpload, walletConnected }) {
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [encrypt, setEncrypt] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [chainLoading, setChainLoading] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef()

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) { setFile(f); setResult(null); setError('') }
  }

  const handleSelect = (e) => {
    const f = e.target.files[0]
    if (f) { setFile(f); setResult(null); setError('') }
  }

  const handleUpload = async () => {
    if (!file) { setError('Please select a file first'); return }
    if (encrypt && !password) { setError('Enter encryption password'); return }
    setError(''); setResult(null); setLoading(true); setProgress(10); setTxHash('')

    const ticker = setInterval(() => setProgress(p => Math.min(p + 8, 85)), 400)
    try {
      const res = await uploadFileToIPFS(file, { name: file.name, encrypt, password })
      clearInterval(ticker); setProgress(100)
      setResult(res)
      onUpload({ type: 'FILE', name: file.name, cid: res.cid, size: res.size || file.size, encrypted: encrypt, mimeType: file.type, gatewayUrl: getGatewayUrl(res.cid) })
    } catch (e) {
      clearInterval(ticker); setProgress(0)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid-2" style={{ alignItems: 'start' }}>
      <div>
        <div className="card">
          <div className="card-title"><span className="icon">⎈</span> Binary Synchronization</div>

          <div
            className={`dropzone${dragOver ? ' drag-over' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div className="dropzone-icon">{file ? getFileIcon(file.type) : '⏏'}</div>
            <h3>{file ? file.name : 'Drop file here or click to browse'}</h3>
            <p>{file ? formatBytes(file.size) : 'Images, PDFs, Videos, JSON, Text and more'}</p>
            <input ref={inputRef} type="file" accept={ACCEPTED} style={{ display: 'none' }} onChange={handleSelect} />
          </div>

          {file && (
            <div className="file-preview">
              <div className="file-icon">{getFileIcon(file.type)}</div>
              <div className="file-info">
                <div className="file-name">{file.name}</div>
                <div className="file-meta">{formatBytes(file.size)} · {file.type || 'unknown type'}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => { setFile(null); setResult(null) }}>✕</button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {['Images', 'PDFs', 'Videos', 'JSON', 'Text', 'ZIP'].map(t => (
              <span key={t} className="badge badge-blue">{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="card">
          <div className="card-title"><span className="icon">⚙</span> Upload Options</div>

          <div className="toggle-row">
            <div>
              <div className="toggle-label">⚿ Encrypt File</div>
              <div className="toggle-desc">Client-side AES-256 ciphering</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={encrypt} onChange={e => setEncrypt(e.target.checked)} />
              <span className="toggle-slider" />
            </label>
          </div>

          {encrypt && (
            <>
              <label>Cipher Passphrase</label>
              <input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="Strong password for decryption" />
            </>
          )}

          {loading && (
            <div className="progress-wrap">
              <div className="progress-label"><span>Synchronizing Asset...</span><span>{progress}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
            </div>
          )}

          {error && <div className="alert alert-error">✕ {error}</div>}

          <button className="btn btn-primary btn-full" onClick={handleUpload} disabled={loading || !file}>
            {loading ? <><div className="spinner" /> Uploading...</> : '⎈ Dispatch to Mesh Network'}
          </button>
        </div>

        {result && (
          <div className="card" style={{ marginTop: '1rem' }}>
            <div className="alert alert-success">✓ File propagated to distributed mesh!</div>
            <CidDisplay cid={result.cid} />
            {result.size && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>Size: {formatBytes(result.size)}</div>}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <a href={`http://127.0.0.1:8080/ipfs/${result.cid}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">⍐ View</a>
              <a href={`https://ipfs.io/ipfs/${result.cid}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">⍈ ipfs.io</a>
            </div>
            {walletConnected && !txHash && (
              <button 
                className="btn btn-secondary btn-full" 
                style={{ marginTop: '1rem', background: 'rgba(139,92,246,0.1)', borderColor: 'var(--accent-2)', color: 'var(--accent-2)' }}
                onClick={async () => {
                  setChainLoading(true)
                  try {
                    const hash = await storeCidOnChain(result.cid, result.name, result.encrypted)
                    setTxHash(hash)
                  } catch(e) {
                    alert('Failed to store on chain: ' + e.message)
                  } finally {
                    setChainLoading(false)
                  }
                }}
                disabled={chainLoading}
              >
                {chainLoading ? 'Storing on chain...' : '⍈ Commit Hash to Ledger'}
              </button>
            )}

            {txHash && (
              <div className="alert alert-success" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column' }}>
                <span style={{ marginBottom: '0.5rem' }}>✓ CID securely stored on Sepolia!</span>
                <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ background: 'rgba(16,185,129,0.1)' }}>
                  ⍐ View on Etherscan
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
