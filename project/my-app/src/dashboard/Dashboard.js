import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import CreateProject from './CreateProject';
 
function Dashboard({ onLogout }) {
    const [projects, setProjects] = useState([]);
    const [view, setView] = useState('projects');
    const [loadError, setLoadError] = useState('');
 
    async function log_out() {
        await fetch('http://localhost:8080/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        onLogout();
    }
 
    useEffect(() => {
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
                                            <div style={pageStyles.projectName}>{p.project_name}</div>
                                            <div style={pageStyles.projectClient}>{p.client_name}</div>
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
    projectName: { fontSize: 14, fontWeight: 600, marginBottom: 4 },
    projectClient: { fontSize: 12, color: '#888' },
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
};
 
export default Dashboard;