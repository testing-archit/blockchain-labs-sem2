# Lab 11 — Hyperledger Fabric: Problems for Assessment
**Student:** Archit  
**Date:** 28 April 2026  
**Platform:** macOS (Apple Silicon — darwin/arm64)

---

## ✅ Task 1 — Install Dependencies & Verify Docker

### Command
```bash
docker --version
docker-compose --version
```

### Output
```
Docker version 29.4.1, build 055a478
Docker Compose version v5.1.3
```

### Explanation
Docker Desktop 29.4.1 was installed and running. Docker Compose is bundled as a Docker CLI plugin (v5.1.3). No additional installation was required since both tools were already present on the system.

---

## ✅ Task 2 — Create Directory & Download Fabric

### Commands
```bash
mkdir -p $HOME/go/src/github.com/$USER
cd $HOME/go/src/github.com/$USER

curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh
chmod +x install-fabric.sh

./install-fabric.sh docker samples binary
```

### Output (key lines)
```
====> Downloading version 2.5.15 platform specific fabric binaries
====> Downloading version 1.5.17 platform specific fabric-ca-client binary
==> Done.

Pull Hyperledger Fabric docker images

FABRIC_IMAGES: peer orderer ccenv baseos
====> Pulling fabric Images

ghcr.io/hyperledger/fabric-baseos:2.5.15      654bd4554bf9   236MB
ghcr.io/hyperledger/fabric-ca:1.5.17          453a0a727e82   358MB
ghcr.io/hyperledger/fabric-ccenv:2.5.15       86dded7eda92   963MB
ghcr.io/hyperledger/fabric-orderer:2.5.15     9972c209be47   163MB
ghcr.io/hyperledger/fabric-peer:2.5.15        3e25adc31a75   217MB
```

### Explanation
The install script:
1. Cloned `hyperledger/fabric-samples` repository
2. Downloaded Fabric v2.5.15 binaries (`peer`, `orderer`, `configtxgen`, etc.) for darwin/arm64
3. Downloaded Fabric CA v1.5.17 binary
4. Pulled all 5 required Docker images from GitHub Container Registry

---

## ✅ Task 3 — Start the Network

### Command
```bash
cd fabric-samples/test-network
./network.sh up
```

### Output
```
Using docker and docker-compose
Starting nodes with CLI timeout of '5' tries and CLI delay of '3' seconds
LOCAL_VERSION=v2.5.15
DOCKER_IMAGE_VERSION=v2.5.15

Generating certificates using cryptogen tool
Creating Org1 Identities
Creating Org2 Identities
Creating Orderer Org Identities
Generating CCP files for Org1 and Org2

[+] up 7/7
 ✔ Network fabric_test                   Created
 ✔ Volume compose_peer0.org1.example.com Created
 ✔ Volume compose_peer0.org2.example.com Created
 ✔ Volume compose_orderer.example.com    Created
 ✔ Container orderer.example.com         Started
 ✔ Container peer0.org1.example.com      Started
 ✔ Container peer0.org2.example.com      Started
```

### `docker ps -a` Output
```
NAMES                    STATUS          PORTS
peer0.org2.example.com   Up 4 minutes    0.0.0.0:9051->9051/tcp, 0.0.0.0:9445->9445/tcp
orderer.example.com      Up 4 minutes    0.0.0.0:7050->7050/tcp, 0.0.0.0:7053->7053/tcp, 0.0.0.0:9443->9443/tcp
peer0.org1.example.com   Up 4 minutes    0.0.0.0:7051->7051/tcp, 0.0.0.0:9444->9444/tcp
```

### Explanation
Three containers were started:
- `peer0.org1.example.com` — Org1 peer on port 7051
- `peer0.org2.example.com` — Org2 peer on port 9051
- `orderer.example.com` — Raft-based orderer on port 7050

---

## ✅ Task 4 — Create Channel (Name: **archit**)

### Command
```bash
./network.sh createChannel -c archit
```

### Output (key lines)
```
Creating channel 'archit'.
Generating channel genesis block 'archit.block'
+ configtxgen -profile ChannelUsingRaft -outputBlock ./channel-artifacts/archit.block -channelID archit
2026-04-28 16:49:44 INFO doOutputBlock -> Writing genesis block

Creating channel archit
Adding orderers
Status: 201
{
    "name": "archit",
    "url": "/participation/v1/channels/archit",
    "consensusRelation": "consenter",
    "status": "active",
    "height": 1
}

Channel 'archit' created
Joining org1 peer to the channel...
Joining org2 peer to the channel...
Anchor peer set for org 'Org1MSP' on channel 'archit'
Anchor peer set for org 'Org2MSP' on channel 'archit'
Channel 'archit' joined
```

### Explanation
A new Fabric channel named `archit` was created using the Raft consensus profile. Both Org1 and Org2 peers joined the channel, and anchor peers were configured for cross-org gossip communication.

---

## ✅ Task 5 — Deploy Chaincode (Name: **archit**)

### Command
```bash
./network.sh deployCC -ccn archit -ccp ../asset-transfer-basic/chaincode-go -ccl go -c archit
```

### Output (key lines)
```
deploying chaincode on channel 'archit'
- CHANNEL_NAME: archit
- CC_NAME: archit
- CC_SRC_PATH: ../asset-transfer-basic/chaincode-go
- CC_SRC_LANGUAGE: go
- CC_VERSION: 1.0

Vendoring Go dependencies at ../asset-transfer-basic/chaincode-go
Finished vendoring Go dependencies

Chaincode is packaged
Chaincode is installed on peer0.org1
Chaincode is installed on peer0.org2

Chaincode definition approved on peer0.org1 on channel 'archit'
Chaincode definition approved on peer0.org2 on channel 'archit'

Approvals:
  Org1MSP: true
  Org2MSP: true

txid [d3150269010104bef2f8ba9942ea73bfd73a0361ad54471ead4ff8928c86a18e] committed with status (VALID) at localhost:9051
txid [d3150269010104bef2f8ba9942ea73bfd73a0361ad54471ead4ff8928c86a18e] committed with status (VALID) at localhost:7051

Chaincode definition committed on channel 'archit'

Committed chaincode definition for chaincode 'archit' on channel 'archit':
Version: 1.0, Sequence: 1, Endorsement Plugin: escc, Validation Plugin: vscc,
Approvals: [Org1MSP: true, Org2MSP: true]
```

### Explanation
The `asset-transfer-basic` Go chaincode was:
1. Packaged as `archit.tar.gz`
2. Installed on both peers (Package ID: `archit_1.0:efe5c5ea...`)
3. Approved by both organizations
4. Committed to the channel with sequence 1

---

## ✅ Task 6 — Interact with Network

### Set Environment Variables
```bash
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
```

---

### 🔹 Initialize Ledger (invoke)

#### Command
```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C archit \
  -n archit \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"InitLedger","Args":[]}'
```

#### Output
```
2026-04-28 16:53:24.068 IST 0001 INFO [chaincodeCmd] chaincodeInvokeOrQuery ->
Chaincode invoke successful. result: status:200
```

#### Explanation
The `InitLedger` function populated the ledger with 6 initial assets. Both peer endorsements (Org1 + Org2) were required since the default endorsement policy is majority (2-of-2). The transaction was committed via the Raft orderer.

---

### 🔹 Query Assets (GetAllAssets)

#### Command
```bash
peer chaincode query \
  -C archit \
  -n archit \
  -c '{"Args":["GetAllAssets"]}'
```

#### Output
```json
[
  {"AppraisedValue":300,"Color":"blue","ID":"asset1","Owner":"Tomoko","Size":5},
  {"AppraisedValue":400,"Color":"red","ID":"asset2","Owner":"Brad","Size":5},
  {"AppraisedValue":500,"Color":"green","ID":"asset3","Owner":"Jin Soo","Size":10},
  {"AppraisedValue":600,"Color":"yellow","ID":"asset4","Owner":"Max","Size":10},
  {"AppraisedValue":700,"Color":"black","ID":"asset5","Owner":"Adriana","Size":15},
  {"AppraisedValue":800,"Color":"white","ID":"asset6","Owner":"Michel","Size":15}
]
```

#### Explanation
The query returned all 6 assets stored in the world state ledger. The `GetAllAssets` function uses a range query across all keys. Each asset has: ID, Color, Size, Owner, and AppraisedValue fields. This confirms that the ledger was successfully initialized and the chaincode is functioning correctly.

---

## ✅ Final Verification Summary

| Check | Status |
|-------|--------|
| Docker running | ✅ v29.4.1 |
| Fabric images pulled (5 images) | ✅ v2.5.15 |
| Network up (3 containers) | ✅ |
| Channel created: `archit` | ✅ |
| Chaincode deployed: `archit` | ✅ v1.0, Seq:1 |
| Both orgs approved chaincode | ✅ Org1MSP + Org2MSP |
| `InitLedger` invoked | ✅ status:200 |
| `GetAllAssets` returns 6 assets | ✅ JSON data |

---

## 🧹 Cleanup (Optional)

```bash
cd ~/go/src/github.com/archit/fabric-samples/test-network
./network.sh down
```

This stops and removes all containers, volumes, and generated crypto material.
