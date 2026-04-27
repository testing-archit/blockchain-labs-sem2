import { useState, useRef, useCallback } from 'react';
import {
  uploadToIPFS, pinCID,
  encryptData, packEncryptedBlob,
} from '../ipfsService';
import { storeCIDOnChain } from '../blockchainService';

const DEFAULT_NAME = 'Avni Saini';
const DEFAULT_ENROLLMENT = 's24cseu1037';

function formatBytes(b) {
  b = parseInt(b || 0);
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(2)} MB`;
}

const FILE_TYPES = [
  { ext: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'avif'], icon: '🖼️', label: 'Image', color: '#818cf8', bg: 'rgba(99,102,241,0.12)' },
  { ext: ['pdf'], icon: '📕', label: 'PDF', color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
  { ext: ['mp4', 'webm', 'mov', 'avi', 'mkv'], icon: '🎬', label: 'Video', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { ext: ['mp3', 'wav', 'ogg', 'flac', 'aac'], icon: '🎵', label: 'Audio', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { ext: ['json'], icon: '📄', label: 'JSON', color: '#14b8a6', bg: 'rgba(20,184,166,0.12)' },
  { ext: ['txt', 'md', 'csv', 'log'], icon: '📝', label: 'Text', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  { ext: ['zip', 'tar', 'gz', 'rar', '7z'], icon: '🗜️', label: 'Archive', color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
  { ext: ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'], icon: '📊', label: 'Office', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
];

function getFileType(name = '') {
  const ext = name.split('.').pop().toLowerCase();
  return FILE_TYPES.find(t => t.ext.includes(ext)) || { icon: '📦', label: 'File', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' };
}

function isImage(name = '') {
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'avif'].includes(name.split('.').pop().toLowerCase());
}
function isVideo(name = '') {
  return ['mp4', 'webm', 'mov'].includes(name.split('.').pop().toLowerCase());
}
function isAudio(name = '') {
  return ['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(name.split('.').pop().toLowerCase());
}
function isPDF(name = '') {
  return name.split('.').pop().toLowerCase() === 'pdf';
}

// ── File preview card ──────────────────────────────────────────────────────
function FileCard({ file, onRemove, objectUrl }) {
  const ft = getFileType(file.name);
  return (
    <div style={{
      border: `1px solid ${ft.color}44`,
      borderRadius: 12,
      background: ft.bg,
      overflow: 'hidden',
      position: 'relative',
      transition: 'transform 0.2s',
    }}>
      {/* Remove button */}
      <button
        onClick={onRemove}
        style={{
          position: 'absolute', top: 8, right: 8, zIndex: 10,
          background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
          width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'white', fontSize: '0.75rem',
        }}
      >✕</button>

      {/* Preview area */}
      <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
        {isImage(file.name) && objectUrl ? (
          <img src={objectUrl} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : isVideo(file.name) && objectUrl ? (
          <video src={objectUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
        ) : isAudio(file.name) && objectUrl ? (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>{ft.icon}</div>
            <audio controls src={objectUrl} style={{ width: '100%', maxWidth: 180 }} />
          </div>
        ) : isPDF(file.name) ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem' }}>📕</div>
            <div style={{ fontSize: '0.72rem', color: ft.color, marginTop: 6, fontWeight: 600 }}>PDF Document</div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem' }}>{ft.icon}</div>
            <div style={{ fontSize: '0.72rem', color: ft.color, marginTop: 6, fontWeight: 600 }}>{ft.label}</div>
          </div>
        )}
      </div>

      {/* File info */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }} title={file.name}>
          {file.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatBytes(file.size)}</span>
          <span style={{
            fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px',
            borderRadius: 999, background: ft.bg, color: ft.color,
            border: `1px solid ${ft.color}44`,
          }}>{ft.label}</span>
        </div>
      </div>
    </div>
  );
}

export default function UploadTab({ addToHistory, toast, wallet }) {
  const [jsonName, setJsonName] = useState(DEFAULT_NAME);
  const [jsonEnroll, setJsonEnroll] = useState(DEFAULT_ENROLLMENT);
  const [extraFields, setExtraFields] = useState('');
  const [manualJson, setManualJson] = useState(
    JSON.stringify({ Name: DEFAULT_NAME, Enrollment: DEFAULT_ENROLLMENT }, null, 2)
  );

  const [files, setFiles] = useState([]);        // array of { file, objectUrl }
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const [mode, setMode] = useState('json-auto');
  const [encrypt, setEncrypt] = useState(false);
  const [encPassword, setEncPassword] = useState('');

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);      // array of result entries
  const [activeResult, setActiveResult] = useState(null);

  const buildAutoJson = () => {
    let obj = { Name: jsonName, Enrollment: jsonEnroll };
    if (extraFields.trim()) {
      try { obj = { ...obj, ...JSON.parse(`{${extraFields}}`) }; } catch { }
    }
    return JSON.stringify(obj, null, 2);
  };

  const addFiles = useCallback((incoming) => {
    const newEntries = Array.from(incoming).map(f => ({
      file: f,
      objectUrl: URL.createObjectURL(f),
    }));
    setFiles(prev => [...prev, ...newEntries]);
  }, []);

  const removeFile = (idx) => {
    setFiles(prev => {
      URL.revokeObjectURL(prev[idx].objectUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleFileChange = (e) => {
    if (e.target.files.length) addFiles(e.target.files);
    e.target.value = '';
  };

  const handleUpload = async () => {
    setUploading(true); setResults([]); setActiveResult(null); setProgress(5);

    try {
      let uploadItems = []; // [{ blob, fileName }]

      if (mode === 'json-auto') {
        uploadItems = [{ blob: new Blob([buildAutoJson()], { type: 'application/json' }), fileName: 'identity.json' }];
      } else if (mode === 'json-manual') {
        let parsed;
        try { parsed = JSON.parse(manualJson); } catch { throw new Error('Invalid JSON — fix syntax errors.'); }
        uploadItems = [{ blob: new Blob([JSON.stringify(parsed, null, 2)], { type: 'application/json' }), fileName: 'manual.json' }];
      } else {
        if (!files.length) throw new Error('Select at least one file.');
        uploadItems = files.map(({ file }) => ({ blob: file, fileName: file.name }));
      }

      const uploadedResults = [];
      for (let i = 0; i < uploadItems.length; i++) {
        let { blob, fileName } = uploadItems[i];
        let keyInfo = null;

        if (encrypt) {
          if (!encPassword.trim()) throw new Error('Encryption password is required');
          const raw = new Uint8Array(await blob.arrayBuffer());
          const { encrypted, iv, salt } = await encryptData(raw, encPassword);
          blob = new Blob([packEncryptedBlob(salt, iv, encrypted)], { type: 'application/octet-stream' });
          fileName += '.enc';
        }

        setProgress(Math.round(10 + ((i / uploadItems.length) * 70)));
        const ipfsResult = await uploadToIPFS(blob, fileName);
        try { await pinCID(ipfsResult.cid); } catch { }

        const entry = {
          cid: ipfsResult.cid, name: fileName,
          size: ipfsResult.size, encrypted: !!encrypt,
          pinned: true, mode,
        };

        if (wallet) {
          try {
            const txData = await storeCIDOnChain(wallet.signer, {
              cid: ipfsResult.cid,
              fileName: fileName,
              fileSize: ipfsResult.size,
              encrypted: !!encrypt
            });
            entry.onChain = true;
            entry.txHash = txData.txHash;
            toast(`Stored on-chain! Tx: ${txData.txHash.slice(0, 10)}...`, 'success');
          } catch (err) {
            toast(`Blockchain store failed: ${err.message}`, 'error');
          }
        }

        uploadedResults.push(entry);
        addToHistory(entry);
      }

      setProgress(100);
      setResults(uploadedResults);
      setActiveResult(uploadedResults[0]);
      toast(`✅ ${uploadedResults.length} file(s) uploaded & pinned!`, 'success');
      if (mode === 'file') setFiles([]);
    } catch (err) {
      toast(err.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1200);
    }
  };

  const copyText = (t) => { navigator.clipboard.writeText(t); toast('Copied!', 'info'); };
  const gatewayUrl = activeResult ? `https://ipfs.io/ipfs/${activeResult.cid}` : '';

  return (
    <div className="grid-2">
      {/* ── LEFT PANEL ── */}
      <div className="card accent-border">
        <div className="card-title">
          <div className="icon-badge purple">⬆️</div>
          Upload to IPFS
        </div>

        {/* Mode tabs */}
        <div className="form-group">
          <label className="form-label">Upload Mode</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { id: 'json-auto', label: '🤖 Auto JSON' },
              { id: 'json-manual', label: '✏️ Manual JSON' },
              { id: 'file', label: '📁 Files / Media' },
            ].map(m => (
              <button key={m.id}
                className={`btn btn-sm ${mode === m.id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setMode(m.id)}>{m.label}</button>
            ))}
          </div>
        </div>

        <hr className="divider" />

        {/* ── AUTO JSON ── */}
        {mode === 'json-auto' && (
          <>
            <div className="info-box info" style={{ marginBottom: 16 }}>
              🤖 Auto-fills Name &amp; Enrollment into a JSON and uploads it.
            </div>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={jsonName} onChange={e => setJsonName(e.target.value)} placeholder="Your Name" />
            </div>
            <div className="form-group">
              <label className="form-label">Enrollment No.</label>
              <input className="form-input" value={jsonEnroll} onChange={e => setJsonEnroll(e.target.value)} placeholder="Enrollment Number" />
            </div>
            <div className="form-group">
              <label className="form-label">Extra Fields (optional)</label>
              <input className="form-input" value={extraFields} onChange={e => setExtraFields(e.target.value)} placeholder='"Lab": "10", "Semester": "2"' />
            </div>
            <div className="form-group">
              <label className="form-label">Preview</label>
              <div className="json-viewer">{buildAutoJson()}</div>
            </div>
          </>
        )}

        {/* ── MANUAL JSON ── */}
        {mode === 'json-manual' && (
          <>
            <div className="info-box warn" style={{ marginBottom: 16 }}>
              ✏️ Write any valid JSON and upload it.
            </div>
            <div className="form-group">
              <label className="form-label">JSON Content</label>
              <textarea className="form-textarea" style={{ minHeight: 200 }}
                value={manualJson} onChange={e => setManualJson(e.target.value)} spellCheck={false} />
            </div>
          </>
        )}

        {/* ── FILE / MEDIA MODE ── */}
        {mode === 'file' && (
          <>
            {/* Supported types row */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {FILE_TYPES.map(ft => (
                <span key={ft.label} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600,
                  background: ft.bg, color: ft.color, border: `1px solid ${ft.color}33`,
                }}>
                  {ft.icon} {ft.label}
                </span>
              ))}
            </div>

            {/* Drop zone */}
            <div
              className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current.click()}
              style={{ padding: '32px 20px' }}
            >
              <span style={{ fontSize: '3rem' }}>📂</span>
              <span className="drop-title">Drop files here or click to browse</span>
              <span className="drop-sub">Images · PDFs · Videos · Audio · Archives · Office docs · Any file</span>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-light)', background: 'var(--accent-glow)', padding: '3px 10px', borderRadius: 999 }}>
                  Multiple files supported
                </span>
              </div>
              <input
                type="file" ref={fileRef} onChange={handleFileChange}
                multiple accept="*/*"
                style={{ display: 'none' }}
              />
            </div>

            {/* File type quick-select buttons */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              {[
                { label: '🖼️ Photos', accept: 'image/*' },
                { label: '📕 PDF', accept: 'application/pdf' },
                { label: '🎬 Video', accept: 'video/*' },
                { label: '🎵 Audio', accept: 'audio/*' },
                { label: '📄 JSON', accept: 'application/json,.json' },
                { label: '📦 Any', accept: '*/*' },
              ].map(({ label, accept }) => (
                <button key={label} className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const inp = document.createElement('input');
                    inp.type = 'file'; inp.multiple = true; inp.accept = accept;
                    inp.onchange = () => { if (inp.files.length) addFiles(inp.files); };
                    inp.click();
                  }}>
                  {label}
                </button>
              ))}
            </div>

            {/* File grid preview */}
            {files.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {files.length} file{files.length > 1 ? 's' : ''} selected
                  </span>
                  <button className="btn btn-secondary btn-sm" onClick={() => { files.forEach(f => URL.revokeObjectURL(f.objectUrl)); setFiles([]); }}>
                    Clear All
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                  {files.map(({ file, objectUrl }, i) => (
                    <FileCard key={i} file={file} objectUrl={objectUrl} onRemove={() => removeFile(i)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <hr className="divider" />

        {/* Encryption toggle */}
        <div className="toggle-row">
          <div>
            <div className="toggle-label">🔐 AES-256 Encryption</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>
              Encrypts before uploading with a password
            </div>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked={encrypt} onChange={e => setEncrypt(e.target.checked)} />
            <span className="toggle-slider" />
          </label>
        </div>

        {encrypt && (
          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">Encryption Password</label>
            <input 
              type="password" 
              className="form-input" 
              value={encPassword} 
              onChange={e => setEncPassword(e.target.value)} 
              placeholder="Enter password to encrypt" 
            />
          </div>
        )}

        {/* Upload button */}
        <button
          className="btn btn-primary btn-full"
          onClick={handleUpload}
          disabled={uploading || (mode === 'file' && !files.length)}
        >
          {uploading
            ? <><span className="spinner" /> Uploading{files.length > 1 ? ` (${files.length} files)` : ''}…</>
            : `⬆️  Upload${mode === 'file' && files.length > 1 ? ` ${files.length} Files` : ''} to IPFS`}
        </button>

        {uploading && progress > 0 && (
          <div className="progress-bar-wrap" style={{ marginTop: 12 }}>
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL: Results ── */}
      <div className="card">
        <div className="card-title">
          <div className="icon-badge teal">✅</div>
          Upload Result
          {results.length > 1 && (
            <span className="chip chip-purple" style={{ marginLeft: 'auto' }}>{results.length} files</span>
          )}
        </div>

        {!activeResult && (
          <div className="empty-state">
            <div className="empty-icon">🌐</div>
            <p>CID, gateway link &amp; file info<br />will appear here after upload.</p>
          </div>
        )}

        {/* Multi-file result tabs */}
        {results.length > 1 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {results.map((r, i) => (
              <button key={i}
                className={`btn btn-sm ${activeResult === r ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveResult(r)}
                style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {getFileType(r.name).icon} {r.name.length > 14 ? r.name.slice(0, 14) + '…' : r.name}
              </button>
            ))}
          </div>
        )}

        {activeResult && (
          <div className="cid-result">
            <div className="cid-result-header">
              ✅ Upload Successful
              <span className="chip chip-green">Pinned</span>
              {activeResult.encrypted && <span className="chip chip-amber">Encrypted</span>}
              <span style={{
                marginLeft: 4, fontSize: '0.72rem', padding: '2px 8px', borderRadius: 999,
                background: getFileType(activeResult.name).bg, color: getFileType(activeResult.name).color,
                border: `1px solid ${getFileType(activeResult.name).color}44`, fontWeight: 700,
              }}>
                {getFileType(activeResult.name).icon} {getFileType(activeResult.name).label}
              </span>
            </div>

            {[
              { label: 'CID', value: activeResult.cid, action: () => copyText(activeResult.cid), actionLabel: 'Copy' },
              { label: 'File', value: activeResult.name },
              { label: 'Size', value: formatBytes(activeResult.size) },
              { label: 'URL', value: gatewayUrl, action: () => window.open(gatewayUrl, '_blank'), actionLabel: 'Open' },
            ].map(row => (
              <div className="cid-row" key={row.label}>
                <span className="cid-label">{row.label}</span>
                <span className="cid-value" title={row.value}>{row.value}</span>
                {row.action && <button className="copy-btn" onClick={row.action}>{row.actionLabel}</button>}
              </div>
            ))}

            {activeResult.encrypted && (
              <div className="info-box warn" style={{ marginTop: 12 }}>
                ⚠️ File is encrypted. You will need your password to retrieve it!
              </div>
            )}
          </div>
        )}

        <div className="info-box info" style={{ marginTop: 24 }}>
          🔗 IPFS uses content-addressing — the CID is a cryptographic hash of your file. Same content always yields the same CID.
        </div>
      </div>
    </div>
  );
}
