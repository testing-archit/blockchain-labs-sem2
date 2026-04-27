const IPFS_API_BASE = "/local-api";

// ── Upload ────────────────────────────────────────────────────────────────────
export async function uploadToIPFS(fileOrBlob, fileName = "file") {
  const formData = new FormData();
  formData.append("file", fileOrBlob, fileName);

  const res = await fetch(`${IPFS_API_BASE}/add?pin=true&wrap-with-directory=false`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`IPFS upload failed (${res.status}): ${txt}`);
  }

  const data = await res.json();
  return { cid: data.Hash, size: data.Size, name: data.Name };
}

// ── Pin ───────────────────────────────────────────────────────────────────────
export async function pinCID(cid) {
  const res = await fetch(`${IPFS_API_BASE}/pin/add?arg=${cid}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Pin failed (${res.status})`);
  return res.json();
}

// ── Retrieve (uses local API) ────────────────────────────────────────────────
export async function retrieveFromIPFS(cid) {
  const res = await fetch(`${IPFS_API_BASE}/cat?arg=${cid}`, {
    method: "POST",
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "Unknown error");
    throw new Error(`Retrieve failed (${res.status}): ${txt}`);
  }

  // Get as ArrayBuffer to support binary (encrypted) data correctly
  const buffer = await res.arrayBuffer();
  return { 
    bytes: new Uint8Array(buffer), 
    gateway: 'Local Node' 
  };
}

export function getGatewayUrl(cid) {
  return `https://ipfs.io/ipfs/${cid}`;
}

// ── AES-256-GCM Encryption (Web Crypto API with PBKDF2) ─────────────────────
export async function deriveKeyFromPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(data, password) {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const cryptoKey = await deriveKeyFromPassword(password, salt);
  const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, data);
  return { encrypted: new Uint8Array(encrypted), iv, salt };
}

export async function decryptData(encryptedBytes, iv, salt, password) {
  const cryptoKey = await deriveKeyFromPassword(password, salt);
  const dec = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, encryptedBytes);
  return new Uint8Array(dec);
}

export function packEncryptedBlob(salt, iv, encrypted) {
  const out = new Uint8Array(salt.length + iv.length + encrypted.length);
  out.set(salt, 0); out.set(iv, salt.length); out.set(encrypted, salt.length + iv.length);
  return out;
}

export function unpackEncryptedBlob(packed) {
  return { salt: packed.slice(0, 16), iv: packed.slice(16, 28), encrypted: packed.slice(28) };
}
