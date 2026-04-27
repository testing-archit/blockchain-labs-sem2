import { useState } from 'react'

export default function CidDisplay({ cid }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(cid)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="cid-box">
      <div className="cid-label">Cryptographic Hash (CID)</div>
      <div className="cid-value">
        <span style={{ flex: 1 }}>{cid}</span>
        <button className="copy-btn" onClick={copy} title="Copy CID">
          {copied ? '✓' : '⬡'}
        </button>
      </div>
    </div>
  )
}
