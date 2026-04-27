require('dotenv').config({ path: '../../.env' })
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const FormData = require('form-data')
const axios = require('axios')
const CryptoJS = require('crypto-js')

const app = express()
const PORT = 3002

const IPFS_API = 'http://127.0.0.1:5001/api/v0'
const IPFS_GATEWAY = 'http://127.0.0.1:8080/ipfs'

app.use(cors())
app.use(express.json({ limit: '50mb' }))

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })

// ── Helper: encrypt ──────────────────────────────────────────────────────────
function encryptContent(content, password) {
  const str = typeof content === 'string' ? content : JSON.stringify(content)
  return CryptoJS.AES.encrypt(str, password).toString()
}

function decryptContent(encrypted, password) {
  const bytes = CryptoJS.AES.decrypt(encrypted, password)
  return bytes.toString(CryptoJS.enc.Utf8)
}

// ── POST /api/upload/file ────────────────────────────────────────────────────
app.post('/api/upload/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' })

    const { name, encrypt, password } = req.body
    let fileBuffer = req.file.buffer
    let fileName = name || req.file.originalname
    let mimeType = req.file.mimetype

    if (encrypt === 'true' && password) {
      const b64 = req.file.buffer.toString('base64')
      const encrypted = encryptContent(`data:${mimeType};base64,${b64}`, password)
      fileBuffer = Buffer.from(encrypted)
      fileName = fileName + '.enc'
      mimeType = 'text/plain'
    }

    const formData = new FormData()
    formData.append('file', fileBuffer, { filename: fileName, contentType: mimeType })

    const response = await axios.post(`${IPFS_API}/add?pin=true`, formData, {
      headers: formData.getHeaders(),
      maxContentLength: Infinity, maxBodyLength: Infinity
    })

    const cid = response.data.Hash || response.data.split('\n')[0].match(/"Hash":"([^"]+)"/)[1]

    res.json({
      cid: cid,
      size: req.file.size,
      gatewayUrl: `${IPFS_GATEWAY}/${cid}`,
      name: fileName,
      encrypted: encrypt === 'true',
    })
  } catch (err) {
    console.error('Upload error:', err.response?.data || err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/upload/json ────────────────────────────────────────────────────
app.post('/api/upload/json', async (req, res) => {
  try {
    const { data, name, encrypt, password } = req.body
    if (!data) return res.status(400).json({ error: 'No JSON data provided' })

    let content = data
    let fileName = name || 'data.json'
    const encrypted = encrypt && password

    if (encrypted) {
      content = { encrypted: true, payload: encryptContent(data, password) }
    }

    const formData = new FormData()
    formData.append('file', Buffer.from(JSON.stringify(content)), { filename: fileName, contentType: 'application/json' })

    const response = await axios.post(`${IPFS_API}/add?pin=true`, formData, {
      headers: formData.getHeaders()
    })

    const cid = response.data.Hash || response.data.split('\n')[0].match(/"Hash":"([^"]+)"/)[1]

    res.json({
      cid: cid,
      size: Buffer.byteLength(JSON.stringify(content)),
      gatewayUrl: `${IPFS_GATEWAY}/${cid}`,
      name: fileName,
      encrypted: !!encrypted,
    })
  } catch (err) {
    console.error('JSON upload error:', err.response?.data || err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/retrieve ───────────────────────────────────────────────────────
app.post('/api/retrieve', async (req, res) => {
  try {
    const { cid, decrypt, password } = req.body
    if (!cid) return res.status(400).json({ error: 'CID is required' })

    const gatewayUrl = `${IPFS_GATEWAY}/${cid}`
    const response = await axios.get(gatewayUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: { Accept: '*/*' },
    })

    const contentType = response.headers['content-type'] || 'application/octet-stream'
    const buffer = Buffer.from(response.data)

    if (contentType.includes('json') || contentType.includes('text')) {
      const text = buffer.toString('utf-8')
      try {
        let parsed = JSON.parse(text)
        if (decrypt && password && parsed.encrypted && parsed.payload) {
          const decrypted = decryptContent(parsed.payload, password)
          try { parsed = JSON.parse(decrypted) } catch { parsed = decrypted }
          return res.json({ content: parsed, contentType: 'application/json', decrypted: true })
        }
        return res.json({ content: parsed, contentType: 'application/json' })
      } catch {
        if (decrypt && password) {
          try {
            const decrypted = decryptContent(text, password)
            let actualContentType = 'text/plain'
            if (decrypted.startsWith('data:')) {
              actualContentType = decrypted.split(';')[0].split(':')[1]
            }
            return res.json({ content: decrypted, contentType: actualContentType, decrypted: true })
          } catch {}
        }
        return res.json({ content: text, contentType: 'text/plain' })
      }
    }

    const b64 = buffer.toString('base64')
    res.json({ content: `data:${contentType};base64,${b64}`, contentType, binary: true })
  } catch (err) {
    console.error('Retrieve error:', err.message)
    res.status(500).json({ error: 'Failed to retrieve from IPFS. Ensure local IPFS daemon is running.' })
  }
})

// ── GET /api/pins ────────────────────────────────────────────────────────────
app.get('/api/pins', async (req, res) => {
  try {
    // Basic pin ls call to local IPFS
    const response = await axios.post(`${IPFS_API}/pin/ls?type=recursive`)
    const pins = Object.keys(response.data.Keys || {}).map(k => ({ cid: k }))
    res.json(pins)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── DELETE /api/unpin/:cid ───────────────────────────────────────────────────
app.delete('/api/unpin/:cid', async (req, res) => {
  try {
    await axios.post(`${IPFS_API}/pin/rm?arg=${req.params.cid}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`\n🚀 IPFS Vault Backend running on http://localhost:${PORT}`)
  console.log(`📦 Connected to LOCAL IPFS Daemon at ${IPFS_API}\n`)
})
