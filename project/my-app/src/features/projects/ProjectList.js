import { useState, useEffect, useCallback } from 'react';
import api from '../../config/api';

function ProjectList({ user }) {
    const [projects, setProjects] = useState([]);
    const [loadError, setLoadError] = useState('');
    const [allViewers, setAllViewers] = useState([]);
    const [projectViewers, setProjectViewers] = useState({});
    const [expandedProject, setExpandedProject] = useState(null);
    const [selectedViewer, setSelectedViewer] = useState({});
    const [loadingAdd, setLoadingAdd] = useState(null);

    const isPM = user?.role === 'pm' || user?.role === 'admin';

    const loadProjects = useCallback(async () => {
        setLoadError('');
        try {
            const { res, data } = await api.get('/projects');
            if (!res.ok) {
                setProjects([]);
                setLoadError(data.message || `Error ${res.status}`);
                return;
            }
            setProjects(Array.isArray(data) ? data : []);
        } catch (err) {
            setProjects([]);
            setLoadError('Error de conexion con el servidor');
        }
    }, []);

    const loadAllViewers = useCallback(async () => {
        try {
            const { res, data } = await api.get('/projects/viewers');
            if (res.ok) setAllViewers(data.viewers || []);
        } catch {}
    }, []);

    useEffect(() => {
        loadProjects();
        if (isPM) loadAllViewers();
    }, [loadProjects, loadAllViewers, isPM]);

    async function loadProjectViewers(projectId) {
        try {
            const { res, data } = await api.get(`/projects/${projectId}/viewers`);
            if (res.ok) {
                setProjectViewers(prev => ({ ...prev, [projectId]: data.viewers || [] }));
            }
        } catch {}
    }

    function toggleExpand(projectId) {
        if (expandedProject === projectId) {
            setExpandedProject(null);
        } else {
            setExpandedProject(projectId);
            loadProjectViewers(projectId);
        }
    }

    async function addViewer(projectId) {
        const viewerId = selectedViewer[projectId];
        if (!viewerId) return;
        setLoadingAdd(projectId);
        try {
            const { res } = await api.post(`/projects/${projectId}/viewers`, { viewer_id: parseInt(viewerId) });
            if (res.ok) {
                setSelectedViewer(prev => ({ ...prev, [projectId]: '' }));
                loadProjectViewers(projectId);
            }
        } catch {}
        finally { setLoadingAdd(null); }
    }

    async function removeViewer(projectId, viewerId) {
        try {
            await api.delete(`/projects/${projectId}/viewers/${viewerId}`);
            loadProjectViewers(projectId);
        } catch {}
    }

    const safeProjects = Array.isArray(projects) ? projects : [];

    return (
        <div>
            <h1 style={s.title}>Projects</h1>
            <p style={s.subtitle}>
                {user?.role === 'viewer' ? 'Projects you are assigned to.' : 'All projects you manage.'}
            </p>

            {loadError && <div style={s.errorBox}>{loadError}</div>}

            {safeProjects.length === 0 ? (
                <div style={s.empty}>
                    {loadError ? 'No se pudieron cargar los proyectos.' : 'No hay proyectos todavia.'}
                </div>
            ) : (
                safeProjects.map(project => {
                    const isExpanded = expandedProject === project.id_project;
                    const viewers = projectViewers[project.id_project] || [];
                    const availableViewers = allViewers.filter(
                        v => !viewers.find(pv => pv.id_user === v.id_user)
                    );
                    const isOwner = user?.role === 'admin' || project.id_pm === user?.id;

                    return (
                        <div key={project.id_project} style={s.card}>
                            <div style={s.cardHeader}>
                                <div>
                                    <div style={s.cardTitle}>{project.project_name}</div>
                                    <div style={s.cardMeta}>{project.client_name}</div>
                                </div>
                                {isPM && isOwner && (
                                    <button style={s.btnSecondary} onClick={() => toggleExpand(project.id_project)}>
                                        {isExpanded ? 'Hide Viewers' : 'Manage Viewers'}
                                    </button>
                                )}
                            </div>

                            {isExpanded && isPM && isOwner && (
                                <div style={s.cardBody}>
                                    <div style={s.sectionLabel}>VIEWERS ({viewers.length})</div>

                                    {viewers.length === 0 ? (
                                        <div style={s.emptyMsg}>No viewers linked yet.</div>
                                    ) : (
                                        viewers.map(v => (
                                            <div key={v.id_user} style={s.viewerRow}>
                                                <span>{v.username} <span style={{ color: '#AAA' }}>· {v.email}</span></span>
                                                <button style={s.btnDanger} onClick={() => removeViewer(project.id_project, v.id_user)}>
                                                    Remove
                                                </button>
                                            </div>
                                        ))
                                    )}

                                    <div style={s.addRow}>
                                        <select
                                            style={s.select}
                                            value={selectedViewer[project.id_project] || ''}
                                            onChange={e => setSelectedViewer(prev => ({
                                                ...prev,
                                                [project.id_project]: e.target.value
                                            }))}
                                        >
                                            <option value="">— Add viewer —</option>
                                            {availableViewers.map(v => (
                                                <option key={v.id_user} value={v.id_user}>
                                                    {v.username} · {v.email}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            style={s.btnSmall}
                                            onClick={() => addViewer(project.id_project)}
                                            disabled={loadingAdd === project.id_project}
                                        >
                                            {loadingAdd === project.id_project ? '...' : 'Add'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}

const s = {
    title: { fontSize: 22, fontWeight: 700, marginBottom: 4 },
    subtitle: { fontSize: 13, color: '#888', marginBottom: 32 },
    errorBox: { padding: '12px 16px', backgroundColor: '#FFF5F5', border: '1px solid #FFCDD2', borderRadius: 4, color: '#B71C1C', fontSize: 13, marginBottom: 16 },
    empty: { padding: 48, textAlign: 'center', backgroundColor: '#FFF', border: '1px dashed #E0E0DE', borderRadius: 6, color: '#888', fontSize: 13 },
    card: { backgroundColor: '#FFF', border: '1px solid #E8E8E6', borderRadius: 6, marginBottom: 12, overflow: 'hidden' },
    cardHeader: { padding: '14px 20px', borderBottom: '1px solid #F0F0EE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { fontSize: 14, fontWeight: 600 },
    cardMeta: { fontSize: 12, color: '#888' },
    cardBody: { padding: '16px 20px' },
    sectionLabel: { fontSize: 11, fontWeight: 600, color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 },
    viewerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F5F5F4', fontSize: 13 },
    addRow: { display: 'flex', gap: 8, marginTop: 12 },
    select: { flex: 1, height: 32, padding: '0 8px', fontSize: 12, border: '1px solid #E0E0DE', borderRadius: 4, backgroundColor: '#FAFAFA' },
    emptyMsg: { fontSize: 13, color: '#AAA', padding: '8px 0' },
    btnSecondary: { height: 36, padding: '0 16px', backgroundColor: 'transparent', color: '#555', border: '1px solid #D0D0CE', borderRadius: 4, fontSize: 13, cursor: 'pointer' },
    btnDanger: { height: 28, padding: '0 10px', backgroundColor: 'transparent', color: '#CC0000', border: '1px solid #FFCDD2', borderRadius: 3, fontSize: 11, cursor: 'pointer' },
    btnSmall: { height: 32, padding: '0 12px', backgroundColor: '#1A1A1A', color: '#FFF', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' },
};

export default ProjectList;
