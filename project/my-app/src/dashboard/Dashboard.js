import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import CreateProject from './CreateProject';

function Dashboard({ onLogout, currentUser: initialUser }) {
    const [projects, setProjects] = useState([]);
    const [view, setView] = useState('projects');
    const [loadError, setLoadError] = useState('');
    const [currentUser, setCurrentUser] = useState(initialUser || null);

    // Si no tenemos rol (auto-login por cookie), lo obtenemos desde /auth/me
    useEffect(() => {
        if (!currentUser?.role) {
            fetch('http://localhost:8080/auth/me', { credentials: 'include' })
                .then(r => r.ok ? r.json() : null)
                .then(me => { if (me) setCurrentUser(me); })
                .catch(() => {});
        }
    }, []); // eslint-disable-line

    async function log_out() {
        await fetch('http://localhost:8080/auth/logout', { method: 'POST', credentials: 'include' });
        onLogout();
    }

    useEffect(() => {
        async function loadProjects() {
            setLoadError('');
            try {
                const res = await fetch('http://localhost:8080/projects', { credentials: 'include' });
                if (!res.ok) {
                    const errBody = await res.json().catch(() => ({}));
                    setProjects([]);
                    setLoadError(errBody.message || errBody.error || `Error ${res.status} cargando proyectos`);
                    return;
                }
                const data = await res.json();
                if (Array.isArray(data)) {
                    setProjects(data);
                } else if (data && Array.isArray(data.projects)) {
                    setProjects(data.projects);
                } else {
                    setProjects([]);
                    setLoadError('Respuesta inesperada del servidor');
                }
            } catch (err) {
                setProjects([]);
                setLoadError('Error de conexión con el servidor');
            }
        }
        loadProjects();
    }, [view]);

    function handleNavigate(key) {
        setView(key === 'dashboard' ? 'dashboard' : key);
    }

    const safeProjects = Array.isArray(projects) ? projects : [];
    const isAdminOrPM = currentUser?.role === 'admin' || currentUser?.role === 'pm';

    // ===== Vista: Create =====
    if (view === 'create') {
        return (
            <div style={wrap}>
                <Sidebar active="projects" onNavigate={handleNavigate} />
                <main style={mainStyle}>
                    <CreateProject onCancel={() => setView('projects')} />
                </main>
            </div>
        );
    }

    // ===== Vista: Projects =====
    if (view === 'projects') {
        return (
            <div style={wrap}>
                <Sidebar active="projects" onNavigate={handleNavigate} />
                <main style={mainStyle}>
                    <div style={pageStyles.page}>
                        <div style={pageStyles.topBar}>
                            <div style={pageStyles.breadcrumb}>
                                <span>Dashboard</span>
                                <span style={{ color: '#CCC' }}>/</span>
                                <span style={{ color: '#1A1A1A', fontWeight: 500 }}>Projects</span>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button style={pageStyles.btnSecondary} onClick={log_out}>Log out</button>
                                {isAdminOrPM && (
                                    <button style={pageStyles.btnPrimary} onClick={() => setView('create')}>
                                        + New Project
                                    </button>
                                )}
                            </div>
                        </div>

                        <div style={pageStyles.body}>
                            <h1 style={pageStyles.title}>Projects</h1>
                            <p style={pageStyles.subtitle}>
                                {currentUser?.role === 'viewer'
                                    ? 'Projects you are assigned to.'
                                    : 'All projects you manage.'}
                            </p>

                            {loadError && <div style={pageStyles.errorBox}>{loadError}</div>}

                            {safeProjects.length === 0 ? (
                                <div style={pageStyles.empty}>
                                    {loadError ? 'No se pudieron cargar los proyectos.' : 'No hay proyectos todavía.'}
                                </div>
                            ) : (
                                <div style={pageStyles.grid}>
                                    {safeProjects.map(p => (
                                        <ProjectCard
                                            key={p.id_project}
                                            project={p}
                                            canManageViewers={isAdminOrPM}
                                            currentUser={currentUser}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // ===== Placeholders =====
    return (
        <div style={wrap}>
            <Sidebar active={view} onNavigate={handleNavigate} />
            <main style={mainStyle}>
                <div style={pageStyles.page}>
                    <div style={pageStyles.topBar}>
                        <div style={pageStyles.breadcrumb}>
                            <span style={{ color: '#1A1A1A', fontWeight: 500, textTransform: 'capitalize' }}>{view}</span>
                        </div>
                        <button style={pageStyles.btnSecondary} onClick={log_out}>Log out</button>
                    </div>
                    <div style={pageStyles.body}>
                        <h1 style={pageStyles.title}>{view.charAt(0).toUpperCase() + view.slice(1)}</h1>
                        <p style={pageStyles.subtitle}>Esta vista todavía no está implementada.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}

// =====================================================
// ProjectCard — muestra info del proyecto y botón
// "Manage Viewers" solo para el PM dueño o admin
// =====================================================
function ProjectCard({ project, canManageViewers, currentUser }) {
    const [showModal, setShowModal] = useState(false);

    const isPMOfProject = currentUser?.role === 'admin' || project.id_pm === currentUser?.id_user;

    return (
        <>
            <div style={pageStyles.projectCard}>
                <div style={pageStyles.projectName}>{project.project_name}</div>
                <div style={pageStyles.projectClient}>{project.client_name}</div>
                {project.deadline && (
                    <div style={pageStyles.projectMeta}>
                        Deadline: {new Date(project.deadline).toLocaleDateString()}
                    </div>
                )}
                {canManageViewers && isPMOfProject && (
                    <button
                        style={pageStyles.btnViewers}
                        onClick={() => setShowModal(true)}
                    >
                        Manage Viewers
                    </button>
                )}
            </div>

            {showModal && (
                <ManageViewersModal
                    project={project}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
}

// =====================================================
// Modal para gestionar viewers de un proyecto existente
// CA-01: solo muestra usuarios con rol 'viewer'
// CA-02: el endpoint ya valida ownership en backend
// CA-03: permite mismo viewer en múltiples proyectos
// =====================================================
function ManageViewersModal({ project, onClose }) {
    const [currentViewers, setCurrentViewers] = useState([]);
    const [availableViewers, setAvailableViewers] = useState([]);
    const [selectedViewerId, setSelectedViewerId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadData();
    }, []); // eslint-disable-line

    async function loadData() {
        setLoading(true);
        setError('');
        try {
            const [viewersRes, allViewersRes] = await Promise.all([
                fetch(`http://localhost:8080/projects/${project.id_project}/viewers`, { credentials: 'include' }),
                fetch('http://localhost:8080/projects/viewers', { credentials: 'include' }),
            ]);

            if (!viewersRes.ok || !allViewersRes.ok) {
                setError('Error cargando datos');
                setLoading(false);
                return;
            }

            const [viewersData, allViewersData] = await Promise.all([
                viewersRes.json(),
                allViewersRes.json(),
            ]);

            const linked = viewersData.viewers || [];
            const all = allViewersData.viewers || [];
            const linkedIds = new Set(linked.map(v => v.id_user));

            setCurrentViewers(linked);
            // Solo muestra los que NO están ya vinculados (CA-03 desde UI)
            setAvailableViewers(all.filter(v => !linkedIds.has(v.id_user)));
        } catch {
            setError('Error de conexión');
        }
        setLoading(false);
    }

    async function handleAdd() {
        if (!selectedViewerId) return;
        setError('');
        setSuccess('');
        try {
            const res = await fetch(`http://localhost:8080/projects/${project.id_project}/viewers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ viewer_id: parseInt(selectedViewerId) }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message || 'Error al agregar viewer');
                return;
            }
            setSuccess('Viewer agregado exitosamente');
            setSelectedViewerId('');
            loadData();
        } catch {
            setError('Error de conexión');
        }
    }

    async function handleRemove(viewerId) {
        setError('');
        setSuccess('');
        try {
            const res = await fetch(`http://localhost:8080/projects/${project.id_project}/viewers/${viewerId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message || 'Error al remover viewer');
                return;
            }
            setSuccess('Viewer desvinculado');
            loadData();
        } catch {
            setError('Error de conexión');
        }
    }

    return (
        <div style={modalStyles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={modalStyles.box}>
                <div style={modalStyles.header}>
                    <div>
                        <div style={modalStyles.title}>Manage Viewers</div>
                        <div style={modalStyles.subtitle}>{project.project_name}</div>
                    </div>
                    <button style={modalStyles.closeBtn} onClick={onClose}>✕</button>
                </div>

                {loading ? (
                    <div style={modalStyles.loading}>Loading...</div>
                ) : (
                    <>
                        {error && <div style={modalStyles.errorMsg}>{error}</div>}
                        {success && <div style={modalStyles.successMsg}>{success}</div>}

                        {/* Agregar viewer — CA-01: solo muestra usuarios con rol viewer */}
                        <div style={modalStyles.section}>
                            <div style={modalStyles.sectionTitle}>Add Viewer</div>
                            {availableViewers.length === 0 ? (
                                <p style={modalStyles.empty}>No hay viewers disponibles para agregar.</p>
                            ) : (
                                <div style={modalStyles.addRow}>
                                    <select
                                        style={modalStyles.select}
                                        value={selectedViewerId}
                                        onChange={e => setSelectedViewerId(e.target.value)}
                                    >
                                        <option value="">Select a viewer...</option>
                                        {availableViewers.map(v => (
                                            <option key={v.id_user} value={v.id_user}>
                                                {v.username} ({v.email})
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        style={selectedViewerId ? modalStyles.btnAdd : modalStyles.btnAddDisabled}
                                        onClick={handleAdd}
                                        disabled={!selectedViewerId}
                                    >
                                        Add
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Viewers actuales del proyecto */}
                        <div style={modalStyles.section}>
                            <div style={modalStyles.sectionTitle}>
                                Current Viewers ({currentViewers.length})
                            </div>
                            {currentViewers.length === 0 ? (
                                <p style={modalStyles.empty}>No hay viewers vinculados a este proyecto.</p>
                            ) : (
                                <div style={modalStyles.viewerList}>
                                    {currentViewers.map(v => (
                                        <div key={v.id_user} style={modalStyles.viewerRow}>
                                            <div>
                                                <div style={modalStyles.viewerName}>{v.username}</div>
                                                <div style={modalStyles.viewerEmail}>{v.email}</div>
                                            </div>
                                            <button
                                                style={modalStyles.btnRemove}
                                                onClick={() => handleRemove(v.id_user)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ===== Estilos =====

const wrap = { display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: '#F5F5F4' };
const mainStyle = { flex: 1, minWidth: 0, overflowX: 'hidden' };

const pageStyles = {
    page: { minHeight: '100vh', backgroundColor: '#F5F5F4', fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", color: '#1A1A1A' },
    topBar: { backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E5E3', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    breadcrumb: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#888' },
    body: { padding: 32, maxWidth: 1200 },
    title: { fontSize: 22, fontWeight: 700, marginBottom: 4 },
    subtitle: { fontSize: 13, color: '#888', marginBottom: 32 },
    errorBox: { padding: '12px 16px', backgroundColor: '#FFF5F5', border: '1px solid #FFCDD2', borderRadius: 4, color: '#B71C1C', fontSize: 13, marginBottom: 16 },
    empty: { padding: 48, textAlign: 'center', backgroundColor: '#FFF', border: '1px dashed #E0E0DE', borderRadius: 6, color: '#888', fontSize: 13 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 },
    projectCard: { backgroundColor: '#FFF', border: '1px solid #E8E8E6', borderRadius: 6, padding: 16 },
    projectName: { fontSize: 14, fontWeight: 600, marginBottom: 4 },
    projectClient: { fontSize: 12, color: '#888', marginBottom: 4 },
    projectMeta: { fontSize: 11, color: '#AAA', marginBottom: 12 },
    btnPrimary: { height: 36, padding: '0 16px', backgroundColor: '#CC0000', color: '#FFF', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    btnSecondary: { height: 36, padding: '0 16px', backgroundColor: 'transparent', color: '#555', border: '1px solid #D0D0CE', borderRadius: 4, fontSize: 13, cursor: 'pointer' },
    btnViewers: { marginTop: 8, width: '100%', height: 30, backgroundColor: 'transparent', color: '#CC0000', border: '1px solid #CC0000', borderRadius: 4, fontSize: 12, cursor: 'pointer', fontWeight: 500 },
};

const modalStyles = {
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    box: { backgroundColor: '#FFF', borderRadius: 8, width: 480, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.16)', fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px 16px', borderBottom: '1px solid #E8E8E6' },
    title: { fontSize: 16, fontWeight: 700, color: '#1A1A1A' },
    subtitle: { fontSize: 12, color: '#888', marginTop: 2 },
    closeBtn: { background: 'none', border: 'none', fontSize: 16, color: '#888', cursor: 'pointer', padding: 4, lineHeight: 1 },
    loading: { padding: 32, textAlign: 'center', color: '#888', fontSize: 13 },
    errorMsg: { margin: '12px 24px 0', padding: '10px 12px', backgroundColor: '#FFF5F5', border: '1px solid #FFCDD2', borderRadius: 4, color: '#B71C1C', fontSize: 13 },
    successMsg: { margin: '12px 24px 0', padding: '10px 12px', backgroundColor: '#F0FFF4', border: '1px solid #C6F6D5', borderRadius: 4, color: '#276749', fontSize: 13 },
    section: { padding: '16px 24px' },
    sectionTitle: { fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 },
    empty: { fontSize: 13, color: '#AAA', margin: 0 },
    addRow: { display: 'flex', gap: 8 },
    select: { flex: 1, height: 36, border: '1px solid #D0D0CE', borderRadius: 4, fontSize: 13, padding: '0 10px', color: '#1A1A1A', backgroundColor: '#FAFAFA' },
    btnAdd: { height: 36, padding: '0 16px', backgroundColor: '#CC0000', color: '#FFF', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
    btnAddDisabled: { height: 36, padding: '0 16px', backgroundColor: '#E0E0DE', color: '#AAA', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'not-allowed', whiteSpace: 'nowrap' },
    viewerList: { display: 'flex', flexDirection: 'column', gap: 8 },
    viewerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#FAFAFA', border: '1px solid #E8E8E6', borderRadius: 4 },
    viewerName: { fontSize: 13, fontWeight: 500, color: '#1A1A1A' },
    viewerEmail: { fontSize: 12, color: '#888' },
    btnRemove: { height: 28, padding: '0 12px', backgroundColor: 'transparent', color: '#B71C1C', border: '1px solid #FFCDD2', borderRadius: 4, fontSize: 12, cursor: 'pointer' },
};

export default Dashboard;
