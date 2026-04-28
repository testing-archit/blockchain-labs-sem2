import express from 'express';
import cors from 'cors';
import * as grpc from '@grpc/grpc-js';
import { connect, hash, signers } from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Fabric connection config ────────────────────────────────────────────────
const FABRIC_BASE = '/Users/archit/go/src/github.com/archit/fabric-samples/test-network';
const MSP_ID = 'Org1MSP';
const CHANNEL = 'archit';
const CHAINCODE = 'archit';
const PEER_ENDPOINT = 'localhost:7051';
const PEER_HOST_ALIAS = 'peer0.org1.example.com';

const CRYPTO_PATH = path.join(FABRIC_BASE, 'organizations/peerOrganizations/org1.example.com');
const CERT_PATH   = path.join(CRYPTO_PATH, 'users/Admin@org1.example.com/msp/signcerts/Admin@org1.example.com-cert.pem');
const KEY_PATH    = path.join(CRYPTO_PATH, 'users/Admin@org1.example.com/msp/keystore/priv_sk');
const TLS_CERT    = path.join(CRYPTO_PATH, 'peers/peer0.org1.example.com/tls/ca.crt');
const ORDERER_CA  = path.join(FABRIC_BASE, 'organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem');

// ─── Transaction log (in-memory ring buffer) ─────────────────────────────────
const txLog = [];
function logTx(type, fn, args, result, durationMs, error = null) {
  txLog.unshift({
    id: crypto.randomBytes(4).toString('hex').toUpperCase(),
    timestamp: new Date().toISOString(),
    type,
    function: fn,
    args,
    result: error ? null : result,
    error: error?.message ?? null,
    durationMs,
  });
  if (txLog.length > 50) txLog.pop();
}

// ─── Build gRPC connection ────────────────────────────────────────────────────
async function newGrpcConnection() {
  const tlsCert = await fs.readFile(TLS_CERT);
  const tlsCredentials = grpc.credentials.createSsl(tlsCert);
  return new grpc.Client(PEER_ENDPOINT, tlsCredentials, {
    'grpc.ssl_target_name_override': PEER_HOST_ALIAS,
  });
}

// ─── Build Fabric Gateway ─────────────────────────────────────────────────────
async function newGateway(client) {
  const certPem  = await fs.readFile(CERT_PATH);
  const keyPem   = await fs.readFile(KEY_PATH);
  const privateKey = crypto.createPrivateKey(keyPem);

  return connect({
    client,
    identity: { mspId: MSP_ID, credentials: certPem },
    signer: signers.newPrivateKeySigner(privateKey),
    hash: hash.sha256,
  });
}

// ─── Express app ─────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// ── Helper: run a query ──────────────────────────────────────────────────────
async function runQuery(fn, ...args) {
  const client  = await newGrpcConnection();
  const gateway = await newGateway(client);
  const t0 = Date.now();
  try {
    const network  = gateway.getNetwork(CHANNEL);
    const contract = network.getContract(CHAINCODE);
    const result   = await contract.evaluateTransaction(fn, ...args);
    const text     = Buffer.from(result).toString();
    logTx('query', fn, args, text, Date.now() - t0);
    return JSON.parse(text);
  } catch (err) {
    let errMsg = err.message;
    if (err.details && err.details.length > 0) {
      errMsg = err.details.map(d => d.message).join(', ');
    }
    logTx('query', fn, args, null, Date.now() - t0, { message: errMsg });
    throw new Error(errMsg);
  } finally {
    gateway.close();
    client.close();
  }
}

// ── Helper: run an invoke ────────────────────────────────────────────────────
async function runInvoke(fn, ...args) {
  const client  = await newGrpcConnection();
  const gateway = await newGateway(client);
  const t0 = Date.now();
  try {
    const network  = gateway.getNetwork(CHANNEL);
    const contract = network.getContract(CHAINCODE);
    const result   = await contract.submitTransaction(fn, ...args);
    const text     = Buffer.from(result).toString() || '{}';
    let parsed;
    try {
      parsed = text && text !== '{}' ? JSON.parse(text) : { ok: true };
    } catch (e) {
      parsed = text; // If it's just a raw string like "Tomoko", return as is
    }
    logTx('invoke', fn, args, text, Date.now() - t0);
    return parsed;
  } catch (err) {
    let errMsg = err.message;
    if (err.details && err.details.length > 0) {
      errMsg = err.details.map(d => d.message).join(', ');
    }
    logTx('invoke', fn, args, null, Date.now() - t0, { message: errMsg });
    throw new Error(errMsg);
  } finally {
    gateway.close();
    client.close();
  }
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// Network info
app.get('/api/network', (req, res) => {
  res.json({
    channel: CHANNEL,
    chaincode: CHAINCODE,
    peer: PEER_ENDPOINT,
    mspId: MSP_ID,
    peerAlias: PEER_HOST_ALIAS,
  });
});

// Health check (tests live connectivity)
app.get('/api/health', async (req, res) => {
  const t0 = Date.now();
  try {
    await runQuery('GetAllAssets');
    res.json({ status: 'connected', latencyMs: Date.now() - t0, channel: CHANNEL });
  } catch (err) {
    res.status(503).json({ status: 'error', error: err.message });
  }
});

// Get all assets
app.get('/api/assets', async (req, res) => {
  try {
    const result = await runQuery('GetAllAssets');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single asset
app.get('/api/assets/:id', async (req, res) => {
  try {
    const result = await runQuery('ReadAsset', req.params.id);
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Create asset
app.post('/api/assets', async (req, res) => {
  const { id, color, size, owner, appraisedValue } = req.body;
  if (!id || !color || !size || !owner || !appraisedValue) {
    return res.status(400).json({ error: 'Missing required fields: id, color, size, owner, appraisedValue' });
  }
  try {
    const result = await runInvoke('CreateAsset', id, color, String(size), owner, String(appraisedValue));
    res.status(201).json({ success: true, asset: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Transfer asset
app.put('/api/assets/:id/transfer', async (req, res) => {
  const { newOwner } = req.body;
  if (!newOwner) return res.status(400).json({ error: 'newOwner is required' });
  try {
    const result = await runInvoke('TransferAsset', req.params.id, newOwner);
    res.json({ success: true, previousOwner: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete asset
app.delete('/api/assets/:id', async (req, res) => {
  try {
    await runInvoke('DeleteAsset', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Init ledger
app.post('/api/ledger/init', async (req, res) => {
  try {
    await runInvoke('InitLedger');
    const assets = await runQuery('GetAllAssets');
    res.json({ success: true, assets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Transaction log
app.get('/api/txlog', (req, res) => {
  res.json(txLog);
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n🔗 Fabric Gateway API running on http://localhost:${PORT}`);
  console.log(`   Channel  : ${CHANNEL}`);
  console.log(`   Chaincode: ${CHAINCODE}`);
  console.log(`   Peer     : ${PEER_ENDPOINT}\n`);
});
