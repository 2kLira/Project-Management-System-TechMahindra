import { useState, useEffect, useCallback } from 'react';
import CreateProject from './CreateProject';

const API = 'http://localhost:8080';

const s = {
    page: { minHeight: '100vh', backgroundColor: '#F5F5F4', fontFamily: "'DM Sans', sans-serif", color: '#1A1A1A' },
    topBar: { backgroundColor: '#FFF', borderBottom: '1px solid #E5E5E3', padding: '0 32px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    topLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
    roleBadge: (role) => ({
        padding: '2px 8px', borderRadius: '3px', fontSize: '11px', fontWeight: '600',
        backgroundColor: role === 'pm' ? '#FFF0F0' : '#F0F4FF',
        color: role === 'pm' ? '#CC0000' : '#3355CC',
        border: `1px solid ${role === 'pm' ? '#FFCDD2' : '#C5D0F0'}`,
    }),
    username: { fontSize: '13px', fontWeight: '500', color: '#1A1A1A' },
    layout: { display: 'flex', minHeight: 'calc(100vh - 56px)' },
    sidebar: { width: '220px', backgroundColor: '#1A1A1A', padding: '24px 0', flexShrink: 0 },
    sidebarLogo: { padding: '0 20px 24px', borderBottom: '1px solid #2E2E2E', marginBottom: '16px' },
    logoBox: { display: 'flex', alignItems: 'center', gap: '10px' },
    logoIcon: { width: '28px', height: '28px', backgroundColor: '#CC0000', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' },
    logoText: { color: '#FFF', fontSize: '13px', fontWeight: '600', lineHeight: '1.3' },
    logoSub: { color: '#666', fontSize: '11px' },
    navLabel: { padding: '4px 20px', fontSize: '10px', fontWeight: '600', color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' },
    navItem: (active) => ({ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 20px', fontSize: '13px', color: active ? '#FFF' : '#888', backgroundColor: active ? '#CC0000' : 'transparent', cursor: 'pointer', borderLeft: active ? '3px solid #FF2222' : '3px solid transparent' }),
    main: { flex: 1, padding: '32px' },
    pageTitle: { fontSize: '22px', fontWeight: '700', marginBottom: '4px' },
    pageSubtitle: { fontSize: '13px', color: '#888', marginBottom: '24px' },
    btnPrimary: { height: '36px', padding: '0 16px', backgroundColor: '#CC0000', color: '#FFF', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    btnSecondary: { height: '36px', padding: '0 16px', backgroundColor: 'transparent', color: '#555', border: '1px solid #D0D0CE', borderRadius: '4px', fontSize: '13px', cursor: 'pointer' },
    btnDanger: { height: '28px', padding: '0 10px', backgroundColor: 'transparent', color: '#CC0000', border: '1px solid #FFCDD2', borderRadius: '3px', fontSize: '11px', cursor: 'pointer' },
    btnSmall: { height: '28px', padding: '0 10px', backgroundColor: '#1A1A1A', color: '#FFF', border: 'none', borderRadius: '3px', fontSize: '11px', cursor: 'pointer' },
    card: { backgroundColor: '#FFF', border: '1px solid #E8E8E6', borderRadius: '6px', marginBottom: '12px', overflow: 'hidden' },
    cardHeader: { padding: '14px 20px', borderBottom: '1px solid #F0F0EE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { fontSize: '14px', fontWeight: '600' },
    cardMeta: { fontSize: '12px', color: '#888' },
    cardBody: { padding: '16px 20px' },
    viewerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F5F5F4', fontSize: '13px' },
    addRow: { display: 'flex', gap: '8px', marginTop: '12px' },
    select: { flex: 1, height: '32px', padding: '0 8px', fontSize: '12px', border: '1px solid #E0E0DE', borderRadius: '4px', backgroundColor: '#FAFAFA' },
    emptyMsg: { fontSize: '13px', color: '#AAA', padding: '12px 0' },
    topActions: { display: 'flex', gap: '10px', alignItems: 'center' },
};

function Dashboard({ user, onLogout }) {
    const [projects, setProjects] = useState([]);
    const [view, setView] = useState('dashboard');
    const [allViewers, setAllViewers] = useState([]);
    const [projectViewers, setProjectViewers] = useState({});
    const [expandedProject, setExpandedProject] = useState(null);
    const [selectedViewer, setSelectedViewer] = useState({});
    const [loadingAdd, setLoadingAdd] = useState(null);

    const isPM = user?.role === 'pm';

    const loadProjects = useCallback(async () => {
        try {
            const res = await fetch(`${API}/projects`, { credentials: 'include' });
            const data = await res.json();
            if (res.ok) setProjects(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const loadAllViewers = useCallback(async () => {
        try {
            const res = await fetch(`${API}/projects/viewers`, { credentials: 'include' });
            const data = await res.json();
            if (res.ok) setAllViewers(data.viewers || []);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        loadProjects();
        if (isPM) loadAllViewers();
    }, [loadProjects, loadAllViewers, isPM]);

    async function loadProjectViewers(projectId) {
        try {
            const res = await fetch(`${API}/projects/${projectId}/viewers`, { credentials: 'include' });
            const data = await res.json();
            if (res.ok) {
                setProjectViewers(prev => ({ ...prev, [projectId]: data.viewers || [] }));
            }
        } catch (err) {
            console.error(err);
        }
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
            const res = await fetch(`${API}/projects/${projectId}/viewers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ viewer_id: parseInt(viewerId) })
            });
            if (res.ok) {
                setSelectedViewer(prev => ({ ...prev, [projectId]: '' }));
                loadProjectViewers(projectId);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingAdd(null);
        }
    }

    async function removeViewer(projectId, viewerId) {
        try {
            await fetch(`${API}/projects/${projectId}/viewers/${viewerId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            loadProjectViewers(projectId);
        } catch (err) {
            console.error(err);
        }
    }

    async function log_out() {
        await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
        onLogout();
    }

    if (view === 'create') {
        return <CreateProject user={user} onCancel={() => { setView('dashboard'); loadProjects(); }} />;
    }

    const roleLabel = isPM ? 'Project Manager' : 'Viewer';

    return (
        <div style={s.page}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

            <div style={s.topBar}>
                <div style={s.topLeft}>
                    <span style={s.username}>{user?.username}</span>
                    <span style={s.roleBadge(user?.role)}>{roleLabel}</span>
                </div>
                <div style={s.topActions}>
                    {isPM && (
                        <button style={s.btnPrimary} onClick={() => setView('create')}>
                            + New Project
                        </button>
                    )}
                    <button style={s.btnSecondary} onClick={log_out}>Log out</button>
                </div>
            </div>

            <div style={s.layout}>
                <div style={s.sidebar}>
                    <div style={s.sidebarLogo}>
                        <div style={s.logoBox}>
                            <div style={s.logoIcon}>
                                <span style={{ color: '#FFF', fontSize: '13px', fontWeight: '700' }}>T</span>
                            </div>
                            <div>
                                <div style={s.logoText}>TECH</div>
                                <div style={s.logoSub}>Mahindra PM</div>
                            </div>
                        </div>
                    </div>
                    <div style={s.navLabel}>Overview</div>
                    <div style={s.navItem(true)}>◫ Projects</div>
                </div>

                <div style={s.main}>
                    <div style={s.pageTitle}>
                        {isPM ? 'My Projects' : 'Projects'}
                    </div>
                    <div style={s.pageSubtitle}>
                        {isPM
                            ? 'Manage your projects and assign viewers.'
                            : 'Projects you have been linked to.'}
                    </div>

                    {projects.length === 0 ? (
                        <p style={s.emptyMsg}>No projects found.</p>
                    ) : (
                        projects.map(project => {
                            const isExpanded = expandedProject === project.id_project;
                            const viewers = projectViewers[project.id_project] || [];
                            const availableViewers = allViewers.filter(
                                v => !viewers.find(pv => pv.id_user === v.id_user)
                            );

                            return (
                                <div key={project.id_project} style={s.card}>
                                    <div style={s.cardHeader}>
                                        <div>
                                            <div style={s.cardTitle}>{project.project_name}</div>
                                            <div style={s.cardMeta}>{project.client_name} · {project.status || 'No status'}</div>
                                        </div>
                                        {isPM && (
                                            <button
                                                style={s.btnSecondary}
                                                onClick={() => toggleExpand(project.id_project)}
                                            >
                                                {isExpanded ? 'Hide Viewers' : 'Manage Viewers'}
                                            </button>
                                        )}
                                    </div>

                                    {isExpanded && isPM && (
                                        <div style={s.cardBody}>
                                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>
                                                VIEWERS ({viewers.length})
                                            </div>

                                            {viewers.length === 0 ? (
                                                <div style={s.emptyMsg}>No viewers linked yet.</div>
                                            ) : (
                                                viewers.map(v => (
                                                    <div key={v.id_user} style={s.viewerRow}>
                                                        <span>{v.username} <span style={{ color: '#AAA' }}>· {v.email}</span></span>
                                                        <button
                                                            style={s.btnDanger}
                                                            onClick={() => removeViewer(project.id_project, v.id_user)}
                                                        >
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
            </div>
        </div>
    );
}

export default Dashboard;
