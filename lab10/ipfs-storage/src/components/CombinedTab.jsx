import { useState, useRef } from 'react'
import { uploadFileToIPFS, uploadJSONToIPFS, getGatewayUrl, formatBytes, getFileIcon } from '../ipfsService'
import CidDisplay from './CidDisplay'
import { storeCidOnChain } from '../ethersService'

const DEFAULT_FIELDS = [
  { key: 'Name', value: 'Archit Gupta' },
  { key: 'Enrollment', value: 'S24CSEU1049' },
  { key: 'Description', value: 'Combined Metadata & Binary Synchronization' }
]

const ACCEPTED = '.jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.txt,.md,.json,.mp4,.mp3,.zip,.csv,.xlsx,.docx'

export default function CombinedTab({ onUpload, walletConnected }) {
  // File State
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef()

  // JSON State
  const [fields, setFields] = useState(DEFAULT_FIELDS)
  const [jsonFilename, setJsonFilename] = useState('metadata.json')

  // Global Upload State
  const [encrypt, setEncrypt] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')
  const [error, setError] = useState('')

  // Results
  const [fileResult, setFileResult] = useState(null)
  const [jsonResult, setJsonResult] = useState(null)
  const [chainLoading, setChainLoading] = useState(false)
  const [txHash, setTxHash] = useState('')

  // Data Node Constructor actions
  const addField = () => setFields(prev => [...prev, { key: '', value: '' }])
  const removeField = (i) => setFields(prev => prev.filter((_, idx) => idx !== i))
  const updateField = (i, k, v) => setFields(prev => prev.map((f, idx) => idx === i ? { ...f, [k]: v } : f))

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  const handleSelect = (e) => {
    const f = e.target.files[0]
    if (f) setFile(f)
  }

  const handleUpload = async () => {
    if (!file) { setError('Please select a file first.'); return }
    if (!jsonFilename.trim()) { setError('Please enter a filename for the JSON metadata.'); return }
    if (encrypt && !password) { setError('Please enter an encryption password.'); return }
    
    setError(''); setFileResult(null); setJsonResult(null); setTxHash('')
    setLoading(true); setProgress(10); setProgressText('Synchronizing Asset...')

    try {
      // 1. Upload File
      const fRes = await uploadFileToIPFS(file, { name: file.name, encrypt, password })
      setFileResult(fRes)
      onUpload({ type: 'FILE', name: file.name, cid: fRes.cid, size: fRes.size || file.size, encrypted: encrypt, mimeType: file.type, gatewayUrl: getGatewayUrl(fRes.cid) })

      setProgress(50); setProgressText('Building & Uploading JSON Metadata...')

      // 2. Build JSON with File info included
      const obj = {}
      fields.forEach(f => { if (f.key.trim()) obj[f.key.trim()] = f.value })
      
      // Inject the file CID and link directly into the JSON (Standard NFT Metadata practice)
      obj.file_cid = fRes.cid
      obj.file_url = `ipfs://${fRes.cid}`
      obj.gateway_url = getGatewayUrl(fRes.cid)

      // 3. Upload JSON
      const jRes = await uploadJSONToIPFS(obj, { name: jsonFilename, encrypt, password })
      setProgress(100); setProgressText('Upload Complete!')
      setJsonResult(jRes)
      onUpload({ type: 'JSON', name: jsonFilename, cid: jRes.cid, size: jRes.size, encrypted: encrypt, mimeType: 'application/json', gatewayUrl: getGatewayUrl(jRes.cid) })

    } catch (e) {
      setProgress(0)
      setError(e.message)
    } finally {
      setTimeout(() => setLoading(false), 500)
    }
  }

  return (
    <div className="grid-2" style={{ alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* FILE SECTION */}
        <div className="card">
          <div className="card-title"><span className="icon">▤</span> 1. Select File</div>
          <div
            className={`dropzone${dragOver ? ' drag-over' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div className="dropzone-icon">{file ? getFileIcon(file.type) : '⏏'}</div>
            <h3>{file ? file.name : 'Drop file here or click to browse'}</h3>
            <p>{file ? formatBytes(file.size) : 'Images, PDFs, Videos, etc.'}</p>
            <input ref={inputRef} type="file" accept={ACCEPTED} style={{ display: 'none' }} onChange={handleSelect} />
          </div>
          {file && (
            <div className="file-preview">
              <div className="file-icon">{getFileIcon(file.type)}</div>
              <div className="file-info">
                <div className="file-name">{file.name}</div>
                <div className="file-meta">{formatBytes(file.size)}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setFile(null)}>✕</button>
            </div>
          )}
        </div>

        {/* JSON SECTION */}
        <div className="card">
          <div className="card-title"><span className="icon">⬡</span> 2. Metadata (JSON)</div>
          <div className="json-field-group">
            {fields.map((f, i) => (
              <div key={i} style={{ marginBottom: '0.75rem' }}>
                <div className="field-pair">
                  <div style={{ flex: 1 }}>
                    <label>Key</label>
                    <input type="text" value={f.key} placeholder="Key" onChange={e => updateField(i, 'key', e.target.value)} style={{ marginBottom: 0 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Value</label>
                    <input type="text" value={f.value} placeholder="Value" onChange={e => updateField(i, 'value', e.target.value)} style={{ marginBottom: 0 }} />
                  </div>
                  <button className="remove-field-btn" onClick={() => removeField(i)} style={{ marginTop: '1.4rem' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-secondary btn-sm btn-full" onClick={addField}>+ Add Metadata Field</button>
          
          <div style={{ marginTop: '1rem' }}>
            <label>JSON Filename</label>
            <input type="text" value={jsonFilename} onChange={e => setJsonFilename(e.target.value)} placeholder="metadata.json" style={{ marginBottom: 0 }} />
          </div>
        </div>

      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* UPLOAD OPTIONS */}
        <div className="card">
          <div className="card-title"><span className="icon">⚡</span> 3. Execute Batch Upload</div>

          <div className="toggle-row">
            <div>
              <div className="toggle-label">⚿ Encrypt Everything</div>
              <div className="toggle-desc">Encrypt both the file and the JSON</div>
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
              <div className="progress-label"><span>{progressText}</span><span>{progress}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, transition: 'width 0.4s ease' }} /></div>
            </div>
          )}

          {error && <div className="alert alert-error">✕ {error}</div>}

          <button className="btn btn-primary btn-full" onClick={handleUpload} disabled={loading || !file}>
            {loading ? <><div className="spinner" /> Processing...</> : '⎈ Dispatch Bundle to Mesh'}
          </button>
        </div>

        {/* RESULTS */}
        {fileResult && jsonResult && (
          <div className="card">
            <div className="alert alert-success">✓ Both files successfully propagated to distributed mesh!</div>
            
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>1. UPLOADED FILE</div>
              <CidDisplay cid={fileResult.cid} />
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>2. METADATA JSON (Links to File)</div>
              <CidDisplay cid={jsonResult.cid} />
            </div>

            {walletConnected && !txHash && (
              <button 
                className="btn btn-secondary btn-full" 
                style={{ marginTop: '1.5rem', background: 'rgba(139,92,246,0.1)', borderColor: 'var(--accent-2)', color: 'var(--accent-2)' }}
                onClick={async () => {
                  setChainLoading(true)
                  try {
                    // Usually we store the JSON metadata CID as it contains the file CID inside it
                    const hash = await storeCidOnChain(jsonResult.cid, jsonResult.name, jsonResult.encrypted)
                    setTxHash(hash)
                  } catch(e) {
                    alert('Failed to store on chain: ' + e.message)
                  } finally {
                    setChainLoading(false)
                  }
                }}
                disabled={chainLoading}
              >
                {chainLoading ? 'Storing on chain...' : '⍈ Commit Metadata Hash to Ledger'}
              </button>
            )}

            {txHash && (
              <div className="alert alert-success" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column' }}>
                <span style={{ marginBottom: '0.5rem' }}>✓ Metadata CID stored on Sepolia!</span>
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
