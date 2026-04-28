const express = require('express');
const cors = require('cors');
const grpc = require('@grpc/grpc-js');
const { connect, signers } = require('@hyperledger/fabric-gateway');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5001;

const NETWORK_ROOT = '/Users/archit/go/src/github.com/archit/fabric-samples/test-network';

function getOrgConfig(org) {
    if (org === 'Org2') {
        const cryptoPath = path.join(NETWORK_ROOT, 'organizations/peerOrganizations/org2.example.com');
        return {
            mspId: 'Org2MSP',
            cryptoPath,
            keyPath: path.join(cryptoPath, 'users/Admin@org2.example.com/msp/keystore/priv_sk'),
            certPath: path.join(cryptoPath, 'users/Admin@org2.example.com/msp/signcerts/Admin@org2.example.com-cert.pem'),
            tlsCertPath: path.join(cryptoPath, 'peers/peer0.org2.example.com/tls/ca.crt'),
            peerEndpoint: 'localhost:9051',
            peerHostAlias: 'peer0.org2.example.com'
        };
    } else {
        const cryptoPath = path.join(NETWORK_ROOT, 'organizations/peerOrganizations/org1.example.com');
        return {
            mspId: 'Org1MSP',
            cryptoPath,
            keyPath: path.join(cryptoPath, 'users/Admin@org1.example.com/msp/keystore/priv_sk'),
            certPath: path.join(cryptoPath, 'users/Admin@org1.example.com/msp/signcerts/Admin@org1.example.com-cert.pem'),
            tlsCertPath: path.join(cryptoPath, 'peers/peer0.org1.example.com/tls/ca.crt'),
            peerEndpoint: 'localhost:7051',
            peerHostAlias: 'peer0.org1.example.com'
        };
    }
}

async function newGrpcConnection(config) {
    const tlsRootCert = await fs.readFile(config.tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(config.peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': config.peerHostAlias,
    });
}

async function newIdentity(config) {
    const credentials = await fs.readFile(config.certPath);
    return { mspId: config.mspId, credentials };
}

async function newSigner(config) {
    const privateKeyPem = await fs.readFile(config.keyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return signers.newPrivateKeySigner(privateKey);
}

const connections = {};

async function getContract(orgName, channelName) {
    const key = `${orgName}-${channelName}`;
    if (!connections[key]) {
        const config = getOrgConfig(orgName);
        const client = await newGrpcConnection(config);
        const gateway = connect({
            client,
            identity: await newIdentity(config),
            signer: await newSigner(config),
            evaluateOptions: () => ({ deadline: Date.now() + 5000 }),
            endorseOptions: () => ({ deadline: Date.now() + 15000 }),
            submitOptions: () => ({ deadline: Date.now() + 5000 }),
            commitStatusOptions: () => ({ deadline: Date.now() + 60000 }),
        });
        const network = gateway.getNetwork(channelName);
        const chaincodeName = channelName === 'archit' ? 'archit' : 'basic';
        const contract = network.getContract(chaincodeName);
        connections[key] = { gateway, contract, client, chaincodeName };
    }
    return connections[key].contract;
}

const txLog = [];

app.get('/api/info', async (req, res) => {
    const { org = 'Org1', channel = 'c1' } = req.query;
    try {
        const contract = await getContract(org, channel);
        const config = getOrgConfig(org);
        const chaincodeName = channel === 'archit' ? 'archit' : 'basic';
        
        res.json({
            channel,
            chaincode: chaincodeName,
            peer: config.peerHostAlias,
            org
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/assets', async (req, res) => {
    const { org = 'Org1', channel = 'c1' } = req.query;
    try {
        const contract = await getContract(org, channel);
        const resultBytes = await contract.evaluateTransaction('GetAllAssets');
        const resultJson = Buffer.from(resultBytes).toString();
        if (!resultJson) {
            return res.json([]);
        }
        res.json(JSON.parse(resultJson));
    } catch (error) {
        console.error('Error querying assets:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/init', async (req, res) => {
    const { org = 'Org1', channel = 'c1' } = req.body;
    try {
        const contract = await getContract(org, channel);
        const commit = await contract.submitAsync('InitLedger');
        const txId = commit.getTransactionId();
        await commit.getResult();
        
        const commitStatus = await commit.getStatus();
        if (!commitStatus.successful) {
            throw new Error(`Transaction failed to commit with status code: ${commitStatus.code}`);
        }
        
        txLog.unshift({
            txId,
            type: 'InitLedger',
            org,
            channel,
            timestamp: new Date().toISOString(),
            status: 'SUCCESS',
            endorsedBy: ['Org1MSP', 'Org2MSP']
        });

        res.json({ message: 'Ledger initialized successfully', txId });
    } catch (error) {
        console.error('Error initializing ledger:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/transfer', async (req, res) => {
    const { assetId, newOwner, org = 'Org1', channel = 'c1' } = req.body;
    try {
        const contract = await getContract(org, channel);
        const commit = await contract.submitAsync('TransferAsset', { arguments: [assetId, newOwner] });
        const txId = commit.getTransactionId();
        await commit.getResult();

        const commitStatus = await commit.getStatus();
        if (!commitStatus.successful) {
            throw new Error(`Transaction failed to commit with status code: ${commitStatus.code}`);
        }

        txLog.unshift({
            txId,
            type: 'TransferAsset',
            assetId,
            newOwner,
            org,
            channel,
            timestamp: new Date().toISOString(),
            status: 'SUCCESS',
            endorsedBy: ['Org1MSP', 'Org2MSP']
        });

        res.json({ message: `Asset ${assetId} transferred to ${newOwner}`, txId });
    } catch (error) {
        console.error('Error transferring asset:', error);
        txLog.unshift({
            txId: 'FAILED-' + Date.now(),
            type: 'TransferAsset',
            assetId,
            newOwner,
            org,
            channel,
            timestamp: new Date().toISOString(),
            status: 'FAILED',
            error: error.message
        });
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/asset/:id', async (req, res) => {
    const { org = 'Org1', channel = 'c1' } = req.query;
    try {
        const contract = await getContract(org, channel);
        const resultBytes = await contract.evaluateTransaction('ReadAsset', req.params.id);
        const resultJson = Buffer.from(resultBytes).toString();
        res.json(JSON.parse(resultJson));
    } catch (error) {
        console.error('Error reading asset:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/history', (req, res) => {
    res.json(txLog);
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
