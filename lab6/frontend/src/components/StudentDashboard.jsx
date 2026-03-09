import { useState } from 'react';

function StudentDashboard({ contract }) {
    const [studentAddress, setStudentAddress] = useState('');
    const [credentials, setCredentials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const fetchCredentials = async () => {
        if (!studentAddress) return;
        try {
            setLoading(true);
            setSearched(true);
            const creds = await contract.methods.getCredentials(studentAddress).call();
            setCredentials(creds);
        } catch (err) {
            console.error(err);
            alert("❌ Failed to fetch credentials");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') fetchCredentials();
    };

    const truncateHash = (hash) => {
        if (!hash || hash.length <= 16) return hash;
        return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
    };

    return (
        <div className="student-dashboard">
            <h2>📚 Student Dashboard</h2>

            <div className="card">
                <h3><span className="card-icon">🔍</span> Look Up Credentials</h3>
                <div className="search-bar">
                    <input
                        placeholder="Enter student wallet address (0x...)"
                        value={studentAddress}
                        onChange={(e) => setStudentAddress(e.target.value)}
                        onKeyDown={handleKeyPress}
                    />
                    <button onClick={fetchCredentials} disabled={loading}>
                        {loading ? '⏳ Searching...' : '🔎 Search'}
                    </button>
                </div>
            </div>

            {searched && (
                <div className="credentials-table">
                    {credentials.length > 0 ? (
                        <div className="card">
                            <h3><span className="card-icon">🏆</span> Credential Records ({credentials.length})</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Credential Name</th>
                                        <th>Course</th>
                                        <th>Document Hash</th>
                                        <th>Issued On</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {credentials.map((cred, index) => (
                                        <tr key={index}>
                                            <td>{index}</td>
                                            <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{cred.name}</td>
                                            <td>{cred.course}</td>
                                            <td>
                                                <a
                                                    href={`https://ipfs.io/ipfs/${cred.hash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="cred-hash"
                                                    title={cred.hash}
                                                >
                                                    {truncateHash(cred.hash)}
                                                </a>
                                            </td>
                                            <td>{new Date(Number(cred.issuedOn) * 1000).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="card">
                            <div className="empty-state">
                                <div className="empty-state-icon">📭</div>
                                <p>No credentials found for this address.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default StudentDashboard;
