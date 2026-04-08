import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import CreateProject from './CreateProject';
 
function Dashboard({ onLogout }) {
    const [projects, setProjects] = useState([]);
    const [view, setView] = useState('projects');
    const [loadError, setLoadError] = useState('');
    const [deletingProjectId, setDeletingProjectId] = useState(null);

    async function loadProjects() {
        setLoadError('');
        try {
            const res = await fetch('http://localhost:8080/projects', {
                credentials: 'include'
            });

            // Si no autenticado o error de servidor: NO intentes parsear como array
            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                console.warn('GET /projects failed:', res.status, errBody);
                setProjects([]);
                setLoadError(errBody.message || errBody.error || `Error ${res.status} cargando proyectos`);
                return;
            }

            const data = await res.json();

            // Defensa total: solo aceptamos arrays
            if (Array.isArray(data)) {
                setProjects(data);
            } else if (data && Array.isArray(data.projects)) {
                setProjects(data.projects);
            } else {
                console.warn('GET /projects returned non-array:', data);
                setProjects([]);
                setLoadError('Respuesta inesperada del servidor');
            }
        } catch (err) {
            console.error('Error de red cargando proyectos:', err);
            setProjects([]);
            setLoadError('Error de conexión con el servidor');
        }
    }

    async function handleDeleteProject(project) {
        const confirmDelete = window.confirm(`¿Seguro que quieres borrar el proyecto "${project.project_name}"? Esta acción no se puede deshacer.`);
        if (!confirmDelete) return;

        setDeletingProjectId(project.id_project);
        setLoadError('');
        try {
            const res = await fetch(`http://localhost:8080/projects/${project.id_project}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setLoadError(data.message || data.error || `Error ${res.status} eliminando proyecto`);
                return;
            }

            await loadProjects();
        } catch (err) {
            console.error('Error eliminando proyecto:', err);
            setLoadError('Error de conexión eliminando proyecto');
        } finally {
            setDeletingProjectId(null);
        }
    }
 
    async function log_out() {
        await fetch('http://localhost:8080/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        onLogout();
    }
 
    useEffect(() => {
        loadProjects();
    }, [view]);
 
    function handleNavigate(key) {
        setView(key === 'dashboard' ? 'dashboard' : key);
    }
 
    // Garantía absoluta: nunca llamamos .map sobre algo que no es array
    const safeProjects = Array.isArray(projects) ? projects : [];
 
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
                                <button style={pageStyles.btnPrimary} onClick={() => setView('create')}>
                                    + New Project
                                </button>
                            </div>
                        </div>
 
                        <div style={pageStyles.body}>
                            <h1 style={pageStyles.title}>Projects</h1>
                            <p style={pageStyles.subtitle}>All projects you have access to.</p>
 
                            {loadError && (
                                <div style={pageStyles.errorBox}>{loadError}</div>
                            )}
 
                            {safeProjects.length === 0 ? (
                                <div style={pageStyles.empty}>
                                    {loadError ? 'No se pudieron cargar los proyectos.' : 'No hay proyectos todavía. Crea el primero.'}
                                </div>
                            ) : (
                                <div style={pageStyles.grid}>
                                    {safeProjects.map(p => (
                                        <div key={p.id_project} style={pageStyles.projectCard}>
                                            <div style={pageStyles.projectHead}>
                                                <div style={pageStyles.projectName}>{p.project_name}</div>
                                                <button
                                                    style={pageStyles.btnDanger}
                                                    onClick={() => handleDeleteProject(p)}
                                                    disabled={deletingProjectId === p.id_project}
                                                    title="Delete project"
                                                    aria-label={`Delete ${p.project_name}`}
                                                >
                                                    {deletingProjectId === p.id_project ? '…' : '×'}
                                                </button>
                                            </div>
                                            <div style={pageStyles.projectClient}>{p.client_name}</div>
                                            <div style={pageStyles.projectMeta}>
                                                Budget: {p.estimated_budget != null ? `$${Number(p.estimated_budget).toLocaleString()}` : 'N/A'}
                                            </div>
                                            <div style={pageStyles.projectMeta}>
                                                Story Points: {p.estimated_sp != null ? p.estimated_sp : 'N/A'}
                                            </div>
                                        </div>
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
 
const wrap = {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#F5F5F4',
};
 
const mainStyle = {
    flex: 1,
    minWidth: 0,
    overflowX: 'hidden',
};
 
const pageStyles = {
    page: {
        minHeight: '100vh',
        backgroundColor: '#F5F5F4',
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
        color: '#1A1A1A',
    },
    topBar: {
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E5E3',
        padding: '0 32px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    breadcrumb: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#888' },
    body: { padding: 32, maxWidth: 1200 },
    title: { fontSize: 22, fontWeight: 700, marginBottom: 4 },
    subtitle: { fontSize: 13, color: '#888', marginBottom: 32 },
    errorBox: {
        padding: '12px 16px',
        backgroundColor: '#FFF5F5',
        border: '1px solid #FFCDD2',
        borderRadius: 4,
        color: '#B71C1C',
        fontSize: 13,
        marginBottom: 16,
    },
    empty: {
        padding: 48,
        textAlign: 'center',
        backgroundColor: '#FFF',
        border: '1px dashed #E0E0DE',
        borderRadius: 6,
        color: '#888',
        fontSize: 13,
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 16,
    },
    projectCard: {
        backgroundColor: '#FFF',
        border: '1px solid #E8E8E6',
        borderRadius: 6,
        padding: 16,
    },
    projectHead: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 4,
    },
    projectName: { fontSize: 14, fontWeight: 600 },
    projectClient: { fontSize: 12, color: '#888' },
    projectMeta: { fontSize: 12, color: '#555', marginTop: 4 },
    btnPrimary: {
        height: 36,
        padding: '0 16px',
        backgroundColor: '#CC0000',
        color: '#FFF',
        border: 'none',
        borderRadius: 4,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
    },
    btnSecondary: {
        height: 36,
        padding: '0 16px',
        backgroundColor: 'transparent',
        color: '#555',
        border: '1px solid #D0D0CE',
        borderRadius: 4,
        fontSize: 13,
        cursor: 'pointer',
    },
    btnDanger: {
        minWidth: 24,
        height: 22,
        padding: 0,
        backgroundColor: '#F5F2EB',
        color: '#6F6657',
        border: '1px solid #E5DDCF',
        borderRadius: 999,
        fontSize: 15,
        lineHeight: '18px',
        textAlign: 'center',
        fontWeight: 500,
        cursor: 'pointer',
    },
};
 
export default Dashboard;