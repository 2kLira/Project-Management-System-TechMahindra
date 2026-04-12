import { useState } from 'react';
import Sidebar from '../../shared/components/Sidebar';
import ProjectList from '../projects/ProjectList';
import CreateProject from '../projects/CreateProject';
import UserManagement from '../users/UserManagement';
import api from '../../config/api';

function Dashboard({ user, onLogout }) {
    const [view, setView] = useState('projects');

    const isPM = user?.role === 'pm' || user?.role === 'admin';

    async function log_out() {
        await api.post('/auth/logout');
        if (onLogout) onLogout();
    }

    if (view === 'create') {
        return (
            <div style={wrap}>
                <Sidebar active="projects" onNavigate={setView} />
                <main style={mainStyle}>
                    <CreateProject onCancel={() => setView('projects')} />
                </main>
            </div>
        );
    }

    if (view === 'users') {
        return (
            <div style={wrap}>
                <Sidebar active="users" onNavigate={setView} />
                <main style={mainStyle}>
                    <UserManagement currentUser={user} onBack={() => setView('projects')} />
                </main>
            </div>
        );
    }

    if (view === 'projects') {
        return (
            <div style={wrap}>
                <Sidebar active="projects" onNavigate={setView} />
                <main style={mainStyle}>
                    <div style={s.page}>
                        <div style={s.topBar}>
                            <div style={s.breadcrumb}>
                                <span>Inicio</span>
                                <span style={{ color: '#CCC' }}>/</span>
                                <span style={{ color: '#1A1A1A', fontWeight: 500 }}>Proyectos</span>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button style={s.btnSecondary} onClick={log_out}>Cerrar sesión</button>
                                {isPM && (
                                    <>
                                        <button style={s.btnPrimary} onClick={() => setView('create')}>
                                            + Nuevo proyecto
                                        </button>
                                        <button style={s.btnSecondary} onClick={() => setView('users')}>
                                            Gestión de usuarios
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        <div style={s.body}>
                            <ProjectList user={user} />
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div style={wrap}>
            <Sidebar active={view} onNavigate={setView} />
            <main style={mainStyle}>
                <div style={s.page}>
                    <div style={s.topBar}>
                        <div style={s.breadcrumb}>
                            <span style={{ color: '#1A1A1A', fontWeight: 500, textTransform: 'capitalize' }}>{view}</span>
                        </div>
                        <button style={s.btnSecondary} onClick={log_out}>Cerrar sesión</button>
                    </div>
                    <div style={s.body}>
                        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{view.charAt(0).toUpperCase() + view.slice(1)}</h1>
                        <p style={{ fontSize: 13, color: '#888' }}>Esta vista aún no está implementada.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}

const wrap = { display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: '#F5F5F4' };
const mainStyle = { flex: 1, minWidth: 0, overflowX: 'hidden' };

const s = {
    page: { minHeight: '100vh', backgroundColor: '#F5F5F4', fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", color: '#1A1A1A' },
    topBar: { backgroundColor: '#FFF', borderBottom: '1px solid #E5E5E3', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    breadcrumb: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#888' },
    body: { padding: 32, maxWidth: 1200 },
    btnPrimary: { height: 36, padding: '0 16px', backgroundColor: '#CC0000', color: '#FFF', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    btnSecondary: { height: 36, padding: '0 16px', backgroundColor: 'transparent', color: '#555', border: '1px solid #D0D0CE', borderRadius: 4, fontSize: 13, cursor: 'pointer' },
};

export default Dashboard;
