import { useState } from 'react';
import { retrieveFromIPFS, getGatewayUrl, decryptData, unpackEncryptedBlob } from '../ipfsService';

export default function RetrieveTab({ history, toast }) {
  const [cid, setCid] = useState('');
  const [encrypted, setEncrypted] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isJson, setIsJson] = useState(false);
  const [fileName, setFileName] = useState('');
  const [objectUrl, setObjectUrl] = useState(null);

  const handleRetrieve = async () => {
    if (!cid.trim()) { toast('Please enter a CID', 'error'); return; }
    setLoading(true); 
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setResult(null); setIsJson(false); setObjectUrl(null);

    try {
      const { bytes, gateway } = await retrieveFromIPFS(cid.trim());
      let finalBytes = bytes;

      if (encrypted) {
        if (!password.trim()) throw new Error('Provide the decryption password');
        const { salt, iv, encrypted: encData } = unpackEncryptedBlob(bytes);
        const decrypted = await decryptData(encData, iv, salt, password.trim());
        finalBytes = decrypted;
      }

      // Try to determine if it's text/JSON or binary
      const decoded = new TextDecoder().decode(finalBytes);
      let isText = true;
      try {
        // Simple check for binary: if it contains null bytes or many non-printable chars
        if (decoded.includes('\u0000')) isText = false;
      } catch { isText = false; }

      if (isText) {
        try { JSON.parse(decoded); setIsJson(true); } catch { setIsJson(false); }
        setResult({ content: decoded, gateway });
      } else {
        // Create an Object URL for binary preview
        const blob = new Blob([finalBytes]);
        const url = URL.createObjectURL(blob);
        setObjectUrl(url);
        setResult({ content: '[Binary Data]', gateway });
      }
      
      toast('File retrieved from IPFS! ✅', 'success');
    } catch (err) {
      console.error(err);
      toast(err.message || 'Retrieval failed', 'error');
    } finally { setLoading(false); }
  };

  const loadFromHistory = (item) => {
    setCid(item.cid);
    setEncrypted(item.encrypted || false);
    setFileName(item.name || '');
    setPassword('');
    toast('Loaded from history', 'info');
  };

  const copyText = (t) => { navigator.clipboard.writeText(t); toast('Copied!', 'info'); };

  return (
    <div className="grid-2">
      {/* Left — Input */}
      <div className="card accent-border">
        <div className="card-title">
          <div className="icon-badge teal">⬇️</div>
          Retrieve from IPFS
        </div>

        <div className="form-group">
          <label className="form-label">CID (Content Identifier)</label>
          <input
            className="form-input"
            value={cid}
            onChange={e => setCid(e.target.value)}
            placeholder="Qm... or bafy..."
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Filename / Extension (optional)</label>
          <input
            className="form-input"
            value={fileName}
            onChange={e => setFileName(e.target.value)}
            placeholder="e.g. image.jpg, document.pdf"
            style={{ fontSize: '0.85rem' }}
          />
        </div>

        <div className="toggle-row">
          <div className="toggle-label">🔐 Content is Encrypted</div>
          <label className="toggle-switch">
            <input type="checkbox" checked={encrypted} onChange={e => setEncrypted(e.target.checked)} />
            <span className="toggle-slider" />
          </label>
        </div>

        {encrypted && (
          <div className="form-group">
            <label className="form-label">Decryption Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter decryption password"
            />
          </div>
        )}

        <button className="btn btn-teal btn-full" onClick={handleRetrieve} disabled={loading}>
          {loading ? <><span className="spinner" /> Retrieving…</> : '⬇️  Retrieve File'}
        </button>

        <div className="info-box info" style={{ marginTop: 16 }}>
          🔍 IPFS retrieves content by its hash (CID) from any node in the network that has it pinned.
        </div>

        {/* Quick-load from history */}
        {history.length > 0 && (
          <>
            <hr className="divider" />
            <div className="form-label" style={{ marginBottom: 10 }}>Quick Load from History</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
              {history.slice(0, 8).map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }}
                  onClick={() => loadFromHistory(h)}>
                  <span style={{ fontSize: '1.2rem' }}>📄</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-light)', marginTop: 2 }}>{h.cid.slice(0,20)}…</div>
                  </div>
                  {h.encrypted && <span className="chip chip-amber" style={{ fontSize: '0.68rem' }}>🔐</span>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right — Result */}
      <div className="card">
        <div className="card-title">
          <div className="icon-badge green">📄</div>
          Retrieved Content
        </div>

        {!result && (
          <div className="empty-state">
            <div className="empty-icon">⬇️</div>
            <p>Retrieved file content<br />will appear here.</p>
          </div>
        )}

        {result && (
          <>
            <div className="cid-result">
              <div className="cid-result-header">
                ✅ Content Retrieved
                {isJson && <span className="chip chip-purple">JSON</span>}
              </div>
              <div className="cid-row">
                <span className="cid-label">Via</span>
                <span className="cid-value">{result.gateway}</span>
              </div>
              <div className="cid-row">
                <span className="cid-label">CID</span>
                <span className="cid-value">{cid}</span>
                <button className="copy-btn" onClick={() => copyText(cid)}>Copy</button>
              </div>
            </div>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Preview {fileName && `(${fileName})`}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                {objectUrl && (
                  <a href={objectUrl} download={fileName || 'retrieved_file'} className="copy-btn" style={{ textDecoration: 'none' }}>
                    💾 Download
                  </a>
                )}
                {!objectUrl && <button className="copy-btn" onClick={() => copyText(result.content)}>Copy Text</button>}
              </div>
            </div>

            <div className="retrieved-content" style={{ padding: objectUrl ? 0 : '12px' }}>
              {objectUrl ? (
                <div style={{ width: '100%', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 8, overflow: 'hidden' }}>
                  {(() => {
                    const ext = fileName.split('.').pop().toLowerCase();
                    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
                      return <img src={objectUrl} alt="Retrieved" style={{ maxWidth: '100%', maxHeight: 500 }} />;
                    }
                    if (['mp4', 'webm', 'mov'].includes(ext)) {
                      return <video src={objectUrl} controls style={{ maxWidth: '100%', maxHeight: 500 }} />;
                    }
                    if (['mp3', 'wav', 'ogg'].includes(ext)) {
                      return <audio src={objectUrl} controls />;
                    }
                    if (ext === 'pdf') {
                      return <iframe src={objectUrl} style={{ width: '100%', height: 500, border: 'none' }} />;
                    }
                    return (
                      <div style={{ textAlign: 'center', padding: 40 }}>
                        <div style={{ fontSize: '4rem', marginBottom: 16 }}>📦</div>
                        <p style={{ color: 'var(--text-muted)' }}>Binary file preview not available.<br/>Use the download button to save the file.</p>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {isJson ? JSON.stringify(JSON.parse(result.content), null, 2) : result.content}
                </pre>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
