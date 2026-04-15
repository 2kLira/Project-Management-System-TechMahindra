import { NavLink } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import './Sidebar.css';

const ICONS = {
    dashboard: '▦',
    projects:  '◫',
    users:     '◎',
    audit:     '≡',
    leader:    '◈',
};

const NAV_ITEMS = [
    { to: '/home',        label: 'Inicio',        icon: 'dashboard', section: 'general'                         },
    { to: '/projects',    label: 'Proyectos',     icon: 'projects',  section: 'general'                         },
    { to: '/users',       label: 'Usuarios',      icon: 'users',     section: 'general',  roles: ['pm','admin'] },
    { to: '/audit',       label: 'Bitácora',      icon: 'audit',     section: 'inteligencia'                    },
    { to: '/leaderboard', label: 'Clasificación', icon: 'leader',    section: 'inteligencia'                    },
];

export default function Sidebar({ onLogout }) {
    const { user } = useAuthContext();

    const visible = NAV_ITEMS.filter(item =>
        !item.roles || (user && item.roles.includes(user.role))
    );

    const general      = visible.filter(i => i.section === 'general');
    const intelligence = visible.filter(i => i.section === 'inteligencia');

    const navClass = ({ isActive }) =>
        'sb-nav-item' + (isActive ? ' sb-nav-item-active' : '');

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
                <div className="sb-section-label">General</div>
                {general.map(item => (
                    <NavLink key={item.to} to={item.to} className={navClass}>
                        <span className="sb-icon">{ICONS[item.icon]}</span>
                        {item.label}
                    </NavLink>
                ))}
            </div>

            <div className="sb-section">
                <div className="sb-section-label">Inteligencia</div>
                {intelligence.map(item => (
                    <NavLink key={item.to} to={item.to} className={navClass}>
                        <span className="sb-icon">{ICONS[item.icon]}</span>
                        {item.label}
                    </NavLink>
                ))}
            </div>

            <div className="sb-logout-wrap">
                <div className="sb-user-info">
                    <span className="sb-user-name">{user?.username}</span>
                    <span className="sb-user-role">{user?.role}</span>
                </div>
                {onLogout && (
                    <button className="sb-logout-btn" onClick={onLogout}>
                        Cerrar sesión
                    </button>
                )}
            </div>
        </aside>
    );
}