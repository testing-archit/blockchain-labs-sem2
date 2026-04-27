import { useState } from 'react'
import { uploadJSONToIPFS, getGatewayUrl, formatBytes } from '../ipfsService'
import CidDisplay from './CidDisplay'

import { storeCidOnChain } from '../ethersService'

const DEFAULT_FIELDS = [
  { key: 'Name', value: 'Archit Gupta' },
  { key: 'Enrollment', value: 'S24CSEU1049' },
]

export default function JsonTab({ onUpload, walletConnected }) {
  const [mode, setMode] = useState('auto') // 'auto' | 'manual'
  const [fields, setFields] = useState(DEFAULT_FIELDS)
  const [manualJson, setManualJson] = useState(JSON.stringify({ Name: 'Archit Gupta', Enrollment: 'S24CSEU1049' }, null, 2))
  const [jsonError, setJsonError] = useState('')
  const [filename, setFilename] = useState('student-identity.json')
  const [encrypt, setEncrypt] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [chainLoading, setChainLoading] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const addField = () => setFields(prev => [...prev, { key: '', value: '' }])
  const removeField = (i) => setFields(prev => prev.filter((_, idx) => idx !== i))
  const updateField = (i, k, v) => setFields(prev => prev.map((f, idx) => idx === i ? { ...f, [k]: v } : f))

  const getAutoJson = () => {
    const obj = {}
    fields.forEach(f => { if (f.key.trim()) obj[f.key.trim()] = f.value })
    return obj
  }

  const syncManualFromAuto = () => {
    setManualJson(JSON.stringify(getAutoJson(), null, 2))
    setMode('manual')
  }

  const validateManual = (val) => {
    try { JSON.parse(val); setJsonError(''); return true }
    catch (e) { setJsonError(e.message); return false }
  }

  const handleUpload = async () => {
    setError(''); setResult(null); setTxHash('')
    let data
    if (mode === 'auto') {
      data = getAutoJson()
    } else {
      if (!validateManual(manualJson)) return
      data = JSON.parse(manualJson)
    }
    if (!filename.trim()) { setError('Please enter a filename'); return }
    if (encrypt && !password) { setError('Enter encryption password'); return }

    setLoading(true)
    try {
      const res = await uploadJSONToIPFS(data, { name: filename, encrypt, password })
      setResult(res)
      onUpload({ type: 'JSON', name: filename, cid: res.cid, size: res.size, encrypted: encrypt, mimeType: 'application/json', gatewayUrl: getGatewayUrl(res.cid) })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid-2" style={{ alignItems: 'start' }}>
      <div>
        <div className="card">
          <div className="card-title"><span className="icon">⬡</span> Data Node Constructor</div>

          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <button className={`btn ${mode === 'auto' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setMode('auto')}>
              ⚡ Auto Builder
            </button>
            <button className={`btn ${mode === 'manual' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setMode('manual')}>
              ✍️ Manual JSON
            </button>
            {mode === 'auto' && (
              <button className="btn btn-secondary btn-sm" onClick={syncManualFromAuto} title="Export to manual editor">
                → Export
              </button>
            )}
          </div>

          {mode === 'auto' ? (
            <div>
              <div className="json-field-group">
                {fields.map((f, i) => (
                  <div key={i} style={{ marginBottom: '0.75rem' }}>
                    <div className="field-pair">
                      <div style={{ flex: 1 }}>
                        <label>Key</label>
                        <input type="text" value={f.key} placeholder="e.g. Name" onChange={e => updateField(i, 'key', e.target.value)} style={{ marginBottom: 0 }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label>Value</label>
                        <input type="text" value={f.value} placeholder="e.g. Archit Gupta" onChange={e => updateField(i, 'value', e.target.value)} style={{ marginBottom: 0 }} />
                      </div>
                      <button className="remove-field-btn" onClick={() => removeField(i)} style={{ marginTop: '1.4rem' }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn btn-secondary btn-sm btn-full" onClick={addField}>+ Add Field</button>

              <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0.75rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>PREVIEW</div>
                <pre style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: 'var(--accent-3)', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(getAutoJson(), null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div>
              <label>JSON Content</label>
              <textarea
                value={manualJson}
                onChange={e => { setManualJson(e.target.value); validateManual(e.target.value) }}
                placeholder='{ "Name": "Archit Gupta", "Enrollment": "S24CSEU1049" }'
                style={{ minHeight: '220px' }}
              />
              {jsonError && <div className="alert alert-error" style={{ marginTop: '-0.5rem' }}>⚠️ {jsonError}</div>}
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="card">
          <div className="card-title"><span className="icon">⚙</span> Upload Options</div>

          <label>Filename</label>
          <input type="text" value={filename} onChange={e => setFilename(e.target.value)} placeholder="student-identity.json" />

          <div className="toggle-row">
            <div>
              <div className="toggle-label">⚿ Encrypt Content</div>
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
              <input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter a strong password" />
            </>
          )}

          {error && <div className="alert alert-error">✕ {error}</div>}

          <button className="btn btn-primary btn-full" onClick={handleUpload} disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? <><div className="spinner" /> Synchronizing Asset...</> : '⎈ Dispatch to Mesh Network'}
          </button>
        </div>

        {result && (
          <div className="card" style={{ marginTop: '1rem' }}>
            <div className="alert alert-success">✓ Successfully uploaded to NexusCloud!</div>
            <CidDisplay cid={result.cid} />
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              <a href={result.gatewayUrl || `http://127.0.0.1:8080/ipfs/${result.cid}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                ⍐ View on Gateway
              </a>
              <a href={`https://ipfs.io/ipfs/${result.cid}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                ⍈ ipfs.io
              </a>
            </div>
            {result.size && <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Size: {formatBytes(result.size)}</div>}
            
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
