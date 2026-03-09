import { useState, useEffect } from 'react';

function AdminDashboard({ contract, account }) {
    const [formData, setFormData] = useState({
        student: '',
        name: '',
        course: '',
        hash: ''
    });
    const [updateData, setUpdateData] = useState({
        student: '',
        index: 0,
        newHash: ''
    });
    const [events, setEvents] = useState([]);
    const [loadingAdd, setLoadingAdd] = useState(false);
    const [loadingUpdate, setLoadingUpdate] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const addedEvents = await contract.getPastEvents('CredentialAdded', { fromBlock: 0, toBlock: 'latest' });
                const updatedEvents = await contract.getPastEvents('CredentialUpdated', { fromBlock: 0, toBlock: 'latest' });
                const allEvents = [...addedEvents, ...updatedEvents].sort((a, b) => b.blockNumber - a.blockNumber);
                setEvents(allEvents);
            } catch (err) {
                console.error("Error fetching events:", err);
            }
        };

        fetchEvents();

        const subscription = contract.events.allEvents()
            .on('data', (event) => {
                setEvents(prev => [event, ...prev]);
            });

        return () => {};
    }, [contract]);

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            setLoadingAdd(true);
            await contract.methods.addCredential(
                formData.student,
                formData.name,
                formData.course,
                formData.hash
            ).send({ from: account });
            alert("✅ Credential issued successfully!");
            setFormData({ student: '', name: '', course: '', hash: '' });
        } catch (err) {
            console.error(err);
            const reason = err?.cause?.message || err?.data?.message || err?.message || 'Unknown error';
            alert(`❌ Failed to add credential:\n${reason}`);
        } finally {
            setLoadingAdd(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            setLoadingUpdate(true);
            await contract.methods.updateCredential(
                updateData.student,
                updateData.index,
                updateData.newHash
            ).send({ from: account });
            alert("✅ Credential hash updated!");
            setUpdateData({ student: '', index: 0, newHash: '' });
        } catch (err) {
            console.error(err);
            const reason = err?.cause?.message || err?.data?.message || err?.message || 'Unknown error';
            alert(`❌ Failed to update credential:\n${reason}`);
        } finally {
            setLoadingUpdate(false);
        }
    };

    return (
        <div className="admin-dashboard">
            <h2>🛡️ Admin Dashboard</h2>

            <div className="dashboard-grid">
                {/* Left column — Forms */}
                <div className="admin-forms">
                    <div className="card">
                        <h3><span className="card-icon">📜</span> Issue New Credential</h3>
                        <form onSubmit={handleAdd}>
                            <div className="form-group">
                                <label>Student Wallet Address</label>
                                <input
                                    placeholder="0x..."
                                    value={formData.student}
                                    onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Credential Name</label>
                                <input
                                    placeholder="e.g. B.Tech Computer Science"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Course</label>
                                <input
                                    placeholder="e.g. CS101"
                                    value={formData.course}
                                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Document Hash (IPFS)</label>
                                <input
                                    placeholder="QmXoypiz..."
                                    value={formData.hash}
                                    onChange={(e) => setFormData({ ...formData, hash: e.target.value })}
                                />
                            </div>
                            <button type="submit" disabled={loadingAdd}>
                                {loadingAdd ? '⏳ Issuing...' : '✨ Issue Credential'}
                            </button>
                        </form>
                    </div>

                    <div className="card">
                        <h3><span className="card-icon">🔄</span> Update Credential Hash</h3>
                        <form onSubmit={handleUpdate}>
                            <div className="form-group">
                                <label>Student Wallet Address</label>
                                <input
                                    placeholder="0x..."
                                    value={updateData.student}
                                    onChange={(e) => setUpdateData({ ...updateData, student: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Credential Index</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={updateData.index}
                                    onChange={(e) => setUpdateData({ ...updateData, index: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>New Document Hash</label>
                                <input
                                    placeholder="QmNewHash..."
                                    value={updateData.newHash}
                                    onChange={(e) => setUpdateData({ ...updateData, newHash: e.target.value })}
                                />
                            </div>
                            <button type="submit" disabled={loadingUpdate}>
                                {loadingUpdate ? '⏳ Updating...' : '🔄 Update Hash'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right column — Event Log */}
                <div className="card event-log-card">
                    <h3><span className="card-icon">📋</span> Event Log</h3>
                    <div className="event-log">
                        {events.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📭</div>
                                <p>No events recorded yet.</p>
                            </div>
                        ) : (
                            events.map((ev, i) => (
                                <div key={i} className="event-item">
                                    <div className="event-header">
                                        <span className="event-name">{ev.event}</span>
                                        <span className="event-block">Block #{ev.blockNumber?.toString()}</span>
                                    </div>
                                    <pre>{JSON.stringify(ev.returnValues, (key, value) =>
                                        typeof value === 'bigint' ? value.toString() : value
                                        , 2)}</pre>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
