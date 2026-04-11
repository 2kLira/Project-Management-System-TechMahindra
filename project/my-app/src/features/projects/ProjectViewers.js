import { useState, useEffect } from 'react';
import api from '../../config/api';

function ProjectViewers({ projectId, projectName, onBack }) {
    const [viewers, setViewers] = useState([]);
    const [availableViewers, setAvailableViewers] = useState([]);
    const [selectedViewer, setSelectedViewer] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        fetchViewers();
        fetchAvailableViewers();
    }, [projectId]);

    async function fetchViewers() {
        try {
            const { res, data } = await api.get(`/projects/${projectId}/viewers`);
            if (res.ok) {
                setViewers(data.viewers || []);
            }
        } catch (error) {
            console.error('Error fetching viewers:', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchAvailableViewers() {
        try {
            const { res: viewersRes, data: viewersData } = await api.get('/projects/viewers');
            const { res: assignedRes, data: assignedData } = await api.get(`/projects/${projectId}/viewers`);

            if (viewersRes.ok && assignedRes.ok) {
                const allViewers = viewersData.viewers || [];
                const assigned = assignedData.viewers || [];
                const assignedIds = new Set(assigned.map(v => v.id_user));
                setAvailableViewers(allViewers.filter(v => !assignedIds.has(v.id_user)));
            }
        } catch (error) {
            console.error('Error fetching available viewers:', error);
        }
    }

    async function handleAddViewer(e) {
        e.preventDefault();
        if (!selectedViewer) {
            setMessage({ text: 'Please select a viewer', type: 'error' });
            return;
        }

        try {
            const { res, data } = await api.post(`/projects/${projectId}/viewers`, { viewer_id: parseInt(selectedViewer) });

            if (res.ok) {
                setMessage({ text: 'Viewer added successfully', type: 'success' });
                setSelectedViewer('');
                fetchViewers();
                fetchAvailableViewers();
            } else {
                setMessage({ text: data.message || 'Error adding viewer', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Error connecting to server', type: 'error' });
        }
    }

    async function handleRemoveViewer(userId) {
        if (!window.confirm('Are you sure you want to remove this viewer?')) return;

        try {
            const { res, data } = await api.delete(`/projects/${projectId}/viewers/${userId}`);

            if (res.ok) {
                setMessage({ text: 'Viewer removed successfully', type: 'success' });
                fetchViewers();
                fetchAvailableViewers();
            } else {
                setMessage({ text: data.message || 'Error removing viewer', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Error connecting to server', type: 'error' });
        }
    }

    if (loading) return <div>Loading...</div>;

    return (
        <div className="project-viewers">
            <button onClick={onBack} className="back-btn">← Back to Projects</button>
            <h2>Manage Viewers - {projectName}</h2>

            {message.text && (
                <div className={`message ${message.type}`}>{message.text}</div>
            )}

            <div className="add-viewer-section">
                <h3>Add Viewer</h3>
                <form onSubmit={handleAddViewer}>
                    <select value={selectedViewer} onChange={(e) => setSelectedViewer(e.target.value)}>
                        <option value="">Select a viewer...</option>
                        {availableViewers.map(viewer => (
                            <option key={viewer.id_user} value={viewer.id_user}>
                                {viewer.username} ({viewer.email})
                            </option>
                        ))}
                    </select>
                    <button type="submit" disabled={!selectedViewer}>Add Viewer</button>
                </form>
                {availableViewers.length === 0 && (
                    <p className="no-data">No available viewers to add</p>
                )}
            </div>

            <div className="viewers-list-section">
                <h3>Current Viewers ({viewers.length})</h3>
                {viewers.length === 0 ? (
                    <p className="no-data">No viewers assigned to this project</p>
                ) : (
                    <table className="viewers-table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {viewers.map(viewer => (
                                <tr key={viewer.id_user}>
                                    <td>{viewer.username}</td>
                                    <td>{viewer.email}</td>
                                    <td>
                                        <button onClick={() => handleRemoveViewer(viewer.id_user)} className="remove-btn">
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default ProjectViewers;
