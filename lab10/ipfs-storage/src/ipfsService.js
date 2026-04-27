// ipfsService.js — Handles all Pinata/IPFS operations
// Uses Pinata public gateway for uploads via backend proxy

const PINATA_API_URL = '/api';
const IPFS_GATEWAY = 'http://127.0.0.1:8080/ipfs';
const FALLBACK_GATEWAY = 'http://localhost:8080/ipfs';

/**
 * Upload a File object to IPFS via Pinata
 */
export async function uploadFileToIPFS(file, options = {}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', options.name || file.name);
  if (options.encrypt) formData.append('encrypt', 'true');
  if (options.password) formData.append('password', options.password);

  const res = await fetch(`${PINATA_API_URL}/upload/file`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || 'Upload failed');
  }

  return res.json();
}

/**
 * Upload a JSON object to IPFS via Pinata
 */
export async function uploadJSONToIPFS(jsonData, options = {}) {
  const res = await fetch(`${PINATA_API_URL}/upload/json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: jsonData,
      name: options.name || 'data.json',
      encrypt: options.encrypt || false,
      password: options.password || '',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || 'Upload failed');
  }

  return res.json();
}

/**
 * Retrieve content from IPFS by CID
 */
export async function retrieveFromIPFS(cid, decrypt = false, password = '') {
  const res = await fetch(`${PINATA_API_URL}/retrieve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cid, decrypt, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Retrieve failed' }));
    throw new Error(err.error || 'Retrieve failed');
  }

  return res.json();
}

/**
 * Get list of pinned files from backend
 */
export async function getPinnedFiles() {
  const res = await fetch(`${PINATA_API_URL}/pins`);
  if (!res.ok) throw new Error('Failed to fetch pins');
  return res.json();
}

/**
 * Unpin a file
 */
export async function unpinFile(cid) {
  const res = await fetch(`${PINATA_API_URL}/unpin/${cid}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Unpin failed');
  return res.json();
}

export function getGatewayUrl(cid) {
  return `${IPFS_GATEWAY}/${cid}`;
}

export function getFallbackUrl(cid) {
  return `${FALLBACK_GATEWAY}/${cid}`;
}

export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function getFileIcon(type) {
  if (!type) return '📄';
  if (type.startsWith('image/')) return '🖼️';
  if (type === 'application/pdf') return '📕';
  if (type === 'application/json' || type.includes('json')) return '📋';
  if (type.includes('video')) return '🎬';
  if (type.includes('audio')) return '🎵';
  if (type.includes('text')) return '📝';
  if (type.includes('zip') || type.includes('archive')) return '🗜️';
  return '📄';
}

export function getFileTypeBadge(type) {
  if (!type) return { label: 'FILE', class: 'badge-blue' };
  if (type.startsWith('image/')) return { label: 'IMAGE', class: 'badge-purple' };
  if (type === 'application/pdf') return { label: 'PDF', class: 'badge-cyan' };
  if (type.includes('json')) return { label: 'JSON', class: 'badge-green' };
  if (type.includes('video')) return { label: 'VIDEO', class: 'badge-purple' };
  return { label: 'FILE', class: 'badge-blue' };
}
