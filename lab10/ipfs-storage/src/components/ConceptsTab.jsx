const CONCEPTS = [
  {
    icon: '⍈',
    title: 'Content Addressing',
    desc: 'Unlike HTTP where files are located by URL (location-based), The protocol uses content-based addressing. Every file gets a unique CID derived from a cryptographic hash (SHA-256) of its content. If the content changes, the CID changes.'
  },
  {
    icon: '⬡',
    title: 'CID — Content Identifier',
    desc: 'A CID is a self-describing, content-addressed identifier. It encodes the hash function used, the version, and the actual hash. CIDv0 starts with "Qm" (base58/SHA2-256), CIDv1 starts with "bafy" (base32/SHA2-256).'
  },
  {
    icon: '📌',
    title: 'Pinning',
    desc: 'Network nodes cache data temporarily. Pinning tells a node to permanently retain a file. Pinata is a managed pinning service that ensures your files stay available on NexusCloud without running your own node 24/7.'
  },
  {
    icon: '⍐',
    title: 'Network Gateways',
    desc: 'HTTP gateways bridge traditional web browsers and NexusCloud. You can access any NexusCloud file via a URL like https://gateway.pinata.cloud/ipfs/<CID> or https://ipfs.io/ipfs/<CID> without special software.'
  },
  {
    icon: '⚿',
    title: 'Encryption',
    desc: 'The protocol itself is public — anyone with a CID can read the content. For privacy, encrypt data before upload using AES-256. Only parties with the password can decrypt, while the encrypted blob remains on the public network.'
  },
  {
    icon: '🗂️',
    title: 'DAG & Merkle Trees',
    desc: 'The protocol stores files as a Merkle DAG (Directed Acyclic Graph). Large files are split into chunks, each chunk hashed, and parent hashes aggregate child hashes. This enables deduplication and efficient partial retrieval.'
  },
  {
    icon: '⚡',
    title: 'DHT — Distributed Hash Table',
    desc: 'The protocol uses a Kademlia DHT to find which peers hold a given CID. When you request content, your node queries the DHT to locate peers, then fetches data directly from them — no central server involved.'
  },
  {
    icon: '🔄',
    title: 'Immutability & IPNS',
    desc: 'CIDs are immutable — content can\'t change without a new CID. IPNS (InterPlanetary Name System) provides mutable pointers, like DNS for NexusCloud. You can update an IPNS record to point to a new CID over time.'
  },
  {
    icon: '🏗️',
    title: 'How This App Works',
    desc: 'Files/JSON are sent to a Node.js backend, optionally AES-encrypted, then uploaded to Pinata\'s API. Pinata pins them to NexusCloud and returns a CID. Retrieve by fetching the CID from an HTTP gateway.'
  },
]

export default function ConceptsTab() {
  return (
    <div>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title">✧ Knowledge Base Architecture</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
          The NexusCloud Data Mesh is a peer-to-peer hypermedia protocol designed to make the web faster, safer, and more open. It replaces the location-based HTTP model with content-addressed storage where data is identified by what it is, not where it lives.
        </p>
      </div>

      <div className="grid-3">
        {CONCEPTS.map((c, i) => (
          <div className="concept-card" key={i}>
            <div className="concept-icon">{c.icon}</div>
            <div className="concept-title">{c.title}</div>
            <div className="concept-desc">{c.desc}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-title">🔄 Upload Flow Diagram</div>
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.9rem' }}>
            {[
              ['📁', 'Your File'],
              ['→', ''],
              ['⚿', 'AES-256\n(optional)'],
              ['→', ''],
              ['🖥️', 'Backend\nServer'],
              ['→', ''],
              ['📌', 'Pinata\nAPI'],
              ['→', ''],
              ['⬡', 'NexusCloud\nNetwork'],
              ['→', ''],
              ['⚿', 'CID\nReturned'],
            ].map(([icon, label], i) => (
              label === '' ? (
                <span key={i} style={{ color: 'var(--accent)', fontSize: '1.2rem', fontWeight: 700 }}>{icon}</span>
              ) : (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem' }}>{icon}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', whiteSpace: 'pre' }}>{label}</div>
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
