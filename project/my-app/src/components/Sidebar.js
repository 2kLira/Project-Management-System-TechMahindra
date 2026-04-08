import React from 'react';
import './Sidebar.css';

const ICONS = {
    dashboard: '▦',
    projects: '◫',
    users: '◎',
    audit: '≡',
    leader: '◈',
};

function Sidebar(props) {
    const active = props.active || 'dashboard';
    const onNavigate = props.onNavigate || function () {};

    const items = [
        { key: 'dashboard', label: 'Dashboard',   icon: 'dashboard', section: 'overview' },
        { key: 'projects',  label: 'Projects',    icon: 'projects',  section: 'overview' },
        { key: 'users',     label: 'Users',       icon: 'users',     section: 'overview' },
        { key: 'audit',     label: 'Audit Log',   icon: 'audit',     section: 'intelligence' },
        { key: 'leader',    label: 'Leaderboard', icon: 'leader',    section: 'intelligence' },
    ];

    const overview = items.filter(i => i.section === 'overview');
    const intelligence = items.filter(i => i.section === 'intelligence');

    return (
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
                <div className="sb-section-label">Overview</div>
                {overview.map(i => (
                    <div
                        key={i.key}
                        className={'sb-nav-item ' + (active === i.key ? 'sb-nav-item-active' : '')}
                        onClick={() => onNavigate(i.key)}
                    >
                        <span className="sb-icon">{ICONS[i.icon]}</span> {i.label}
                    </div>
                ))}
            </div>

            <div className="sb-section">
                <div className="sb-section-label">Intelligence</div>
                {intelligence.map(i => (
                    <div
                        key={i.key}
                        className={'sb-nav-item ' + (active === i.key ? 'sb-nav-item-active' : '')}
                        onClick={() => onNavigate(i.key)}
                    >
                        <span className="sb-icon">{ICONS[i.icon]}</span> {i.label}
                    </div>
                ))}
            </div>
        </aside>
    );
}

export default Sidebar;