import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  formatEther,
  isAddress,
} from "ethers";
import abi from "./abi/CollectibleCertificate.json";
import "./App.css";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS ?? "";
const RPC_URL = import.meta.env.VITE_PUBLIC_RPC_URL ?? "";

type TokenView = {
  tokenId: number;
  owner: string;
  tokenURI: string;
  metadata?: {
    name?: string;
    description?: string;
    image?: string;
    attributes?: Array<{ trait_type?: string; value?: string }>;
  };
};

const ipfsToHttp = (uri: string) =>
  uri.startsWith("ipfs://") ? uri.replace("ipfs://", "https://ipfs.io/ipfs/") : uri;

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Something went wrong. Please try again.";
};

function App() {
  const [account, setAccount] = useState("");
  const [networkName, setNetworkName] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");
  const [publicMintEnabled, setPublicMintEnabled] = useState(false);
  const [mintFeeWei, setMintFeeWei] = useState<bigint>(0n);
  const [formattedMintFee, setFormattedMintFee] = useState("0");
  const [totalMinted, setTotalMinted] = useState(0);
  const [tokens, setTokens] = useState<TokenView[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingContract, setLoadingContract] = useState(false);
  const [txPending, setTxPending] = useState(false);

  const [publicMintUri, setPublicMintUri] = useState("");
  const [ownerMintAddress, setOwnerMintAddress] = useState("");
  const [ownerMintUri, setOwnerMintUri] = useState("");
  const [setUriTokenId, setSetUriTokenId] = useState("");
  const [setUriValue, setSetUriValue] = useState("");

  const readProvider = useMemo(() => {
    if (RPC_URL) {
      return new JsonRpcProvider(RPC_URL);
    }
    if (window.ethereum) {
      return new BrowserProvider(window.ethereum);
    }
    return undefined;
  }, []);

  const readContract = useMemo(() => {
    if (!CONTRACT_ADDRESS || !readProvider) {
      return undefined;
    }
    return new Contract(CONTRACT_ADDRESS, abi, readProvider);
  }, [readProvider]);

  const [signerContract, setSignerContract] = useState<Contract>();

  const refreshContractState = useCallback(async () => {
    if (!readContract) {
      return;
    }
    setLoadingContract(true);
    setErrorMessage("");
    try {
      const [fee, owner, minted, isPublicMintOn] = await Promise.all([
        readContract.mintFee(),
        readContract.owner(),
        readContract.totalMinted(),
        readContract.publicMintEnabled(),
      ]);
      setMintFeeWei(fee);
      setFormattedMintFee(formatEther(fee));
      setOwnerAddress(owner);
      setTotalMinted(Number(minted));
      setPublicMintEnabled(isPublicMintOn);

      const mintedCount = Number(minted);
      const tokenViews: TokenView[] = [];
      for (let tokenId = 1; tokenId <= mintedCount; tokenId++) {
        try {
          const [tokenOwner, tokenURI] = await Promise.all([
            readContract.ownerOf(tokenId),
            readContract.tokenURI(tokenId),
          ]);

          let metadata: TokenView["metadata"];
          const resolved = ipfsToHttp(tokenURI);
          if (resolved) {
            try {
              const response = await fetch(resolved);
              if (response.ok) {
                metadata = await response.json();
              }
            } catch {
              // network errors are non-critical here
            }
          }

          tokenViews.push({
            tokenId,
            owner: tokenOwner,
            tokenURI,
            metadata,
          });
        } catch (tokenError) {
          console.warn("Failed to load token", tokenId, tokenError);
        }
      }
      setTokens(tokenViews);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoadingContract(false);
    }
  }, [readContract]);

  useEffect(() => {
    refreshContractState();
  }, [refreshContractState]);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setErrorMessage("No injected wallet found. Install MetaMask or a compatible wallet.");
      return;
    }
    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      setAccount(address);
      setNetworkName(`${network.name || "network"} (#${network.chainId})`);
      setSignerContract(new Contract(CONTRACT_ADDRESS, abi, signer));
      setStatusMessage("Wallet connected.");
      setErrorMessage("");
      await refreshContractState();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }, [refreshContractState]);

  const ensureSigner = () => {
    if (!signerContract) {
      setErrorMessage("Connect your wallet to continue.");
      return false;
    }
    return true;
  };

  const runTx = async (action: () => Promise<unknown>, successMessage: string) => {
    if (!ensureSigner()) {
      return;
    }
    setTxPending(true);
    setErrorMessage("");
    setStatusMessage("Submitting transaction...");
    try {
      const tx = await action();
      if (tx && typeof tx === "object" && "hash" in tx) {
        setStatusMessage(`Waiting for confirmation... (${tx.hash as string})`);
        // @ts-expect-error - ethers tx has wait
        await tx.wait();
      }
      setStatusMessage(successMessage);
      await refreshContractState();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setTxPending(false);
    }
  };

  const handlePublicMint = async () => {
    if (!publicMintUri) {
      setErrorMessage("Enter a metadata URI to mint.");
      return;
    }
    await runTx(
      () => signerContract!.publicMint(publicMintUri, { value: mintFeeWei }),
      "Public mint completed."
    );
    setPublicMintUri("");
  };

  const handleOwnerMint = async () => {
    if (!isAddress(ownerMintAddress)) {
      setErrorMessage("Enter a valid recipient address.");
      return;
    }
    if (!ownerMintUri) {
      setErrorMessage("Enter a metadata URI for the owner mint.");
      return;
    }
    await runTx(
      () => signerContract!.ownerMint(ownerMintAddress, ownerMintUri),
      "Owner mint completed."
    );
    setOwnerMintAddress("");
    setOwnerMintUri("");
  };

  const handleSetTokenUri = async () => {
    const tokenId = Number(setUriTokenId);
    if (!Number.isInteger(tokenId) || tokenId <= 0) {
      setErrorMessage("Provide a valid token ID.");
      return;
    }
    if (!setUriValue) {
      setErrorMessage("Provide a metadata URI.");
      return;
    }
    await runTx(
      () => signerContract!.setTokenURI(tokenId, setUriValue),
      `Token #${tokenId} metadata updated.`
    );
    setSetUriTokenId("");
    setSetUriValue("");
  };

  const togglePublicMint = async () => {
    await runTx(
      () => signerContract!.setPublicMintEnabled(!publicMintEnabled),
      `Public mint ${publicMintEnabled ? "disabled" : "enabled"}.`
    );
  };

  const pauseContract = async () => {
    await runTx(() => signerContract!.pause(), "Contract paused.");
  };

  const unpauseContract = async () => {
    await runTx(() => signerContract!.unpause(), "Contract unpaused.");
  };

  const isOwner = ownerAddress && account && ownerAddress.toLowerCase() === account.toLowerCase();

  return (
    <div className="app">
      <header>
        <div>
          <h1>Collectible Certificates</h1>
          <p className="subtitle">
            Mint and manage certificate NFTs powered by the existing Hardhat backend.
          </p>
          <div className="contract-meta">
            <span>
              Contract:
              <code>{CONTRACT_ADDRESS || "Set VITE_CONTRACT_ADDRESS"}</code>
            </span>
            {ownerAddress && (
              <span>
                Owner: <code>{ownerAddress}</code>
              </span>
            )}
          </div>
        </div>
        <div className="wallet-panel">
          <button onClick={connectWallet} disabled={txPending}>
            {account ? "Wallet Connected" : "Connect Wallet"}
          </button>
          {account && (
            <>
              <p>{account}</p>
              <p className="network">{networkName}</p>
            </>
          )}
        </div>
      </header>

      <section className="status">
        {loadingContract && <p>Loading contract state...</p>}
        {statusMessage && !loadingContract && <p className="success">{statusMessage}</p>}
        {errorMessage && <p className="error">{errorMessage}</p>}
      </section>

      <section className="grid">
        <article>
          <h2>Collection Overview</h2>
          <ul>
            <li>Total Minted: {totalMinted}</li>
            <li>Mint Fee: {formattedMintFee} ETH</li>
            <li>Public Mint: {publicMintEnabled ? "Enabled" : "Disabled"}</li>
          </ul>
          <button onClick={refreshContractState} disabled={loadingContract}>
            Refresh
          </button>
        </article>

        <article>
          <h2>Public Mint</h2>
          <p>Provide an IPFS metadata URI and pay exactly the mint fee.</p>
          <label>
            Metadata URI
            <input
              type="text"
              placeholder="ipfs://..."
              value={publicMintUri}
              onChange={(event) => setPublicMintUri(event.target.value)}
            />
          </label>
          <button onClick={handlePublicMint} disabled={txPending}>
            Mint for {formattedMintFee} ETH
          </button>
        </article>

        <article>
          <h2>Owner Tools</h2>
          <p>{isOwner ? "You are the contract owner." : "Connect as owner to enable admin actions."}</p>
          <label>
            Recipient Address
            <input
              type="text"
              placeholder="0x..."
              value={ownerMintAddress}
              onChange={(event) => setOwnerMintAddress(event.target.value)}
              disabled={!isOwner}
            />
          </label>
          <label>
            Metadata URI
            <input
              type="text"
              placeholder="ipfs://..."
              value={ownerMintUri}
              onChange={(event) => setOwnerMintUri(event.target.value)}
              disabled={!isOwner}
            />
          </label>
          <button onClick={handleOwnerMint} disabled={!isOwner || txPending}>
            Owner Mint
          </button>
          <div className="owner-actions">
            <button onClick={togglePublicMint} disabled={!isOwner || txPending}>
              {publicMintEnabled ? "Disable" : "Enable"} Public Mint
            </button>
            <button onClick={pauseContract} disabled={!isOwner || txPending}>
              Pause
            </button>
            <button onClick={unpauseContract} disabled={!isOwner || txPending}>
              Unpause
            </button>
          </div>
        </article>

        <article>
          <h2>Update Token Metadata</h2>
          <label>
            Token ID
            <input
              type="number"
              min="1"
              value={setUriTokenId}
              onChange={(event) => setSetUriTokenId(event.target.value)}
              disabled={!isOwner}
            />
          </label>
          <label>
            Metadata URI
            <input
              type="text"
              placeholder="ipfs://..."
              value={setUriValue}
              onChange={(event) => setSetUriValue(event.target.value)}
              disabled={!isOwner}
            />
          </label>
          <button onClick={handleSetTokenUri} disabled={!isOwner || txPending}>
            Update URI
          </button>
        </article>
      </section>

      <section className="tokens">
        <div className="tokens-header">
          <h2>Minted Certificates</h2>
          <p>Live view of the on-chain data pulled via the existing backend.</p>
        </div>
        {tokens.length === 0 && <p>No certificates minted yet.</p>}
        <div className="token-grid">
          {tokens.map((token) => (
            <article className="token-card" key={token.tokenId}>
              <div className="token-id">#{token.tokenId}</div>
              {token.metadata?.image && (
                <img src={ipfsToHttp(token.metadata.image)} alt={token.metadata?.name ?? "NFT"} />
              )}
              <h3>{token.metadata?.name ?? "Untitled Certificate"}</h3>
              <p className="owner">
                Owner: <code>{token.owner}</code>
              </p>
              <p className="uri">
                URI:{" "}
                <a href={ipfsToHttp(token.tokenURI)} target="_blank" rel="noreferrer">
                  {token.tokenURI}
                </a>
              </p>
              {token.metadata?.description && <p>{token.metadata.description}</p>}
              {token.metadata?.attributes && (
                <ul className="attributes">
                  {token.metadata.attributes.map((attr, idx) => (
                    <li key={`${token.tokenId}-${idx}`}>
                      <span>{attr.trait_type ?? "Trait"}</span>
                      <strong>{attr.value ?? "N/A"}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;
