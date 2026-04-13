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
            setMessage({ text: 'Selecciona un visor', type: 'error' });
            return;
        }

        try {
            const { res, data } = await api.post(`/projects/${projectId}/viewers`, { viewer_id: parseInt(selectedViewer) });

            if (res.ok) {
                setMessage({ text: 'Visor agregado correctamente', type: 'success' });
                setSelectedViewer('');
                fetchViewers();
                fetchAvailableViewers();
            } else {
                setMessage({ text: data.message || 'Error al agregar visor', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Error de conexión con el servidor', type: 'error' });
        }
    }

    async function handleRemoveViewer(userId) {
        if (!window.confirm('¿Estás seguro de que deseas quitar a este visor?')) return;

        try {
            const { res, data } = await api.delete(`/projects/${projectId}/viewers/${userId}`);

            if (res.ok) {
                setMessage({ text: 'Visor eliminado correctamente', type: 'success' });
                fetchViewers();
                fetchAvailableViewers();
            } else {
                setMessage({ text: data.message || 'Error al eliminar visor', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Error de conexión con el servidor', type: 'error' });
        }
    }

    if (loading) return <div>Cargando...</div>;

    return (
        <div className="project-viewers">
            <button onClick={onBack} className="back-btn">← Volver a proyectos</button>
            <h2>Gestionar visores - {projectName}</h2>

            {message.text && (
                <div className={`message ${message.type}`}>{message.text}</div>
            )}

            <div className="add-viewer-section">
                <h3>Agregar visor</h3>
                <form onSubmit={handleAddViewer}>
                    <select value={selectedViewer} onChange={(e) => setSelectedViewer(e.target.value)}>
                        <option value="">Selecciona un visor...</option>
                        {availableViewers.map(viewer => (
                            <option key={viewer.id_user} value={viewer.id_user}>
                                {viewer.username} ({viewer.email})
                            </option>
                        ))}
                    </select>
                    <button type="submit" disabled={!selectedViewer}>Agregar visor</button>
                </form>
                {availableViewers.length === 0 && (
                    <p className="no-data">No hay visores disponibles para agregar</p>
                )}
            </div>

            <div className="viewers-list-section">
                <h3>Visores actuales ({viewers.length})</h3>
                {viewers.length === 0 ? (
                    <p className="no-data">Sin visores asignados a este proyecto</p>
                ) : (
                    <table className="viewers-table">
                        <thead>
                            <tr>
                                <th>Usuario</th>
                                <th>Correo</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {viewers.map(viewer => (
                                <tr key={viewer.id_user}>
                                    <td>{viewer.username}</td>
                                    <td>{viewer.email}</td>
                                    <td>
                                        <button onClick={() => handleRemoveViewer(viewer.id_user)} className="remove-btn">
                                            Quitar
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
