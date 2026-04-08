## CollectibleCertificate NFT Suite

This Hardhat workspace hosts a feature-complete ERC-721 certificate contract that covers the three requested tasks:

- **Task 1:** Core ERC-721 with explicit name/symbol, owner-only minting, deployment script, and immediate minting of two NFTs to distinct addresses.
- **Task 2:** Metadata/IPFS management via explicit token URI mapping, `setTokenURI`, and end-to-end tests validating minting plus metadata retrieval.
- **Task 3:** Production-style minting flow with fee enforcement, maximum supply, token ID auto-incrementing, mint events, pause/unpause, owner-access controls, public mint toggling, and reentrancy protection. Scripts and config are ready for Sepolia.

### Getting Started

```bash
cp .env.example .env          # populate RPC URL, private key, and optional Etherscan key
npm install                   # already run once, but safe to repeat
npm run build                 # compile the contracts
npm test                      # execute the Hardhat test suite
```

### Tests

`test/CollectibleCertificate.ts` exercises:
- Owner minting and `ownerOf`/`tokenURI` lookups (Task 1 + 2 expectations).
- Public mint fee enforcement with metadata reads.
- Supply-cap exhaustion.
- Pause/unpause gating for mints.

All three Task 3 scenarios plus the IPFS requirement are covered by `npm test`.

### Deployment & Interaction

1. **Local demo (Hardhat in-memory network):**
   ```bash
   npm run deploy:local
   ```
   - Deploys `CollectibleCertificate`.
   - Automatically mints Token #1 to the deployer and Token #2 to the second signer, each with distinct IPFS URIs.
   - Enables public minting so the follow-up script can run.

2. **Interaction script:**
   - Set `DEPLOYED_CONTRACT_ADDRESS` inside `.env`.
   - Run `npm run interact:local` (for the Hardhat network) or `npx hardhat run --network sepolia scripts/interact.ts` after a real deployment.
   - Script toggles public mint (if needed), mints with the configured fee, and prints `ownerOf` + `tokenURI` details for the new NFT.

3. **Sepolia deployment:**
   ```bash
   # inside .env
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/...
   SEPOLIA_PRIVATE_KEY=0x...
   npm run deploy:sepolia
   ```
   The deploy script uses the wallet tied to `SEPOLIA_PRIVATE_KEY`, ensuring the contract owner controls pause, URI updates, and public mint toggles on Sepolia. After deployment, re-run `scripts/interact.ts` against Sepolia (with the deployed address) to mint live certificates.

### IPFS Metadata

- `metadata/sample-certificate.json` is a ready-to-upload template. Pin it to IPFS via your preferred service (Pinata, web3.storage, etc.) and plug the resulting `ipfs://` URI into `ownerMint`, `publicMint`, or `setTokenURI`.
- The deployment script uses placeholder CID strings to prove the workflow end-to-end; replace them with actual hashes after uploading.
- Because token URIs are stored on-chain and exposed via `tokenURI()`, wallets and explorers can always fetch certificate metadata.

### Owner/Student Verification

After running the deployment script you can programmatically verify ownership:

```bash
npx hardhat console --network hardhat
> const c = await ethers.getContractAt("CollectibleCertificate", "0x...");  // address printed by deploy script
> await c.ownerOf(1)   // returns address that received the first certificate
> await c.tokenURI(1)  // returns its IPFS metadata link
```

Use the same approach on Sepolia (with `--network sepolia`) once you have a live deployment.

### Frontend UI (Task Extension)

- A standalone React/Vite interface lives under `frontend/` and talks to the existing contract without altering the backend logic.
- Setup:
  ```bash
  cd frontend
  cp .env.example .env                 # set VITE_CONTRACT_ADDRESS (+ optional RPC URL)
  npm install
  npm run dev                         # launches the UI on http://localhost:5173
  ```
- The UI lets students connect a wallet, pay the mint fee with an IPFS URI, view minted certificates plus metadata, and lets the contract owner toggle public minting, pause/unpause, owner-mint, and update URIs. All reads are powered by the same Hardhat-generated ABI dropped into `frontend/src/abi/CollectibleCertificate.json`.
