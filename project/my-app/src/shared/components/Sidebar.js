import React from 'react';
import './Sidebar.css';
import { useNavigate, useLocation, Outlet } from "react-router-dom";

const ICONS = {
    dashboard: '▦',
    projects: '◫',
    users: '◎',
    audit: '≡',
    leader: '◈',
};

function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const items = [
        { key: 'dashboard',      label: 'Inicio',        icon: 'dashboard', section: 'general' },
        { key: 'project',        label: 'Proyectos',     icon: 'projects',  section: 'general' },
        { key: 'usuarios',       label: 'Usuarios',      icon: 'users',     section: 'general' },
        { key: 'audit',          label: 'Bitácora',      icon: 'audit',     section: 'inteligencia' },
        { key: 'leader',         label: 'Clasificación', icon: 'leader',    section: 'inteligencia' },
    ];

    const overview     = items.filter(i => i.section === 'general');
    const intelligence = items.filter(i => i.section === 'inteligencia');

    const active = location.pathname.split('/').pop();

    return (
        <div className="sb-layout">
            <aside className="sb-sidebar">
                <div className="sb-logo-wrap">
                    <div className="sb-logo-box">
                        <div className="sb-logo-icon">T</div>
                        <div>
                            <div className="sb-logo-text">TECH</div>
                            <div className="sb-logo-sub">Mahindra PM</div>
                        </div>
                    </div>
                </div>

                <div className="sb-section">
                    <div className="sb-section-label">General</div>
                    {overview.map(i => (
                        <div
                            key={i.key}
                            className={'sb-nav-item ' + (active === i.key ? 'sb-nav-item-active' : '')}
                            onClick={() => navigate('/menu/' + i.key)}
                        >
                            <span className="sb-icon">{ICONS[i.icon]}</span> {i.label}
                        </div>
                    ))}
                </div>

                <div className="sb-section">
                    <div className="sb-section-label">Inteligencia</div>
                    {intelligence.map(i => (
                        <div
                            key={i.key}
                            className={'sb-nav-item ' + (active === i.key ? 'sb-nav-item-active' : '')}
                            onClick={() => navigate('/menu/' + i.key)}
                        >
                            <span className="sb-icon">{ICONS[i.icon]}</span> {i.label}
                        </div>
                    ))}
                </div>
            </aside>

            <main className="sb-content">
                <Outlet />
            </main>
        </div>
    );
}

export default Sidebar;