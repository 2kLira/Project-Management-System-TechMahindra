import { NavLink, useLocation, useParams } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import './Sidebar.css';

const ICONS = {
    dashboard: '▣',
    projects:  '▭',
    users:     '◉',
    audit:     '≡',
    leader:    '◇',
    personal:  '◦',
};

const NAV_ITEMS = [
    { to: '/home',        label: 'Inicio',        icon: 'dashboard', section: 'general'                         },
    { to: '/projects',    label: 'Proyectos',     icon: 'projects',  section: 'general'                         },
    { to: '/users',       label: 'Usuarios',      icon: 'users',     section: 'general',  roles: ['pm','admin'] },
    { to: '/audit',       label: 'Bitácora',      icon: 'audit',     section: 'inteligencia'                    },
    { to: '/leaderboard', label: 'Clasificación', icon: 'leader',    section: 'inteligencia'                    },
];

const VIEWER_NAV_ITEMS = [
    { to: '/home',        label: 'Personal Dashboard', icon: 'personal', section: 'my_work' },
    { to: '/projects',    label: 'Projects',           icon: 'projects', section: 'my_work' },
    { to: '/leaderboard', label: 'Leaderboard',        icon: 'leader',   section: 'recognition' },
];

export default function Sidebar({ onLogout }) {
    const { user } = useAuthContext();
    const location = useLocation();
    const params = useParams();
    const isViewer = user?.role === 'viewer';
    const isViewerProjectWorkspace = isViewer && /^\/projects\/\d+\/view$/.test(location.pathname);
    const projectId = params?.id;
    const projectNameFromState = location.state?.projectName;
    const projectSectionTitle = (projectNameFromState || `Proyecto ${projectId || ''}`).toUpperCase();

    const visible = (isViewer ? VIEWER_NAV_ITEMS : NAV_ITEMS).filter(item =>
        !item.roles || (user && item.roles.includes(user.role))
    );

    const general = visible.filter(i => i.section === 'general');
    const intelligence = visible.filter(i => i.section === 'inteligencia');
    const myWork = visible.filter(i => i.section === 'my_work');
    const recognition = visible.filter(i => i.section === 'recognition');

    const navClass = ({ isActive }) =>
        'sb-nav-item' + (isActive ? ' sb-nav-item-active' : '');

    const projectMenuClass = (isActive) =>
        'sb-nav-item sb-nav-item-project' + (isActive ? ' sb-nav-item-active' : '');

    return (
        <aside className="sb-sidebar">
            <div className="sb-logo-wrap">
                <div className="sb-logo-box">
                    <div className="sb-logo-icon">T</div>
                    <div>
                        <div className="sb-logo-text">{isViewer ? 'Viewer Dashboard' : 'TECH'}</div>
                        <div className="sb-logo-sub">Mahindra PM</div>
                    </div>
                </div>
            </div>

            {isViewer ? (
                <>
                    <div className="sb-section">
                        <div className="sb-section-label">My Work</div>
                        {isViewerProjectWorkspace ? (
                            <>
                                <NavLink to="/home" className={navClass}>
                                    <span className="sb-icon">{ICONS.personal}</span>
                                    Personal Dashboard
                                </NavLink>
                                <NavLink to="/projects" className={navClass}>
                                    <span className="sb-icon">{ICONS.projects}</span>
                                    Projects
                                </NavLink>
                            </>
                        ) : (
                            myWork.map(item => (
                                <NavLink key={item.to} to={item.to} className={navClass}>
                                    <span className="sb-icon">{ICONS[item.icon]}</span>
                                    {item.label}
                                </NavLink>
                            ))
                        )}
                    </div>

                    {isViewerProjectWorkspace && (
                        <div className="sb-section">
                            <div className="sb-section-label">{projectSectionTitle}</div>
                            <div className={projectMenuClass(true)}>
                                <span className="sb-icon">▣</span>
                                Dashboard
                            </div>
                            <div className={projectMenuClass(false)}>
                                <span className="sb-icon">▤</span>
                                Backlog
                            </div>
                            <div className={projectMenuClass(false)}>
                                <span className="sb-icon">◫</span>
                                Sprints
                            </div>
                            <div className={projectMenuClass(false)}>
                                <span className="sb-icon">▥</span>
                                Sprint Board
                            </div>
                            <div className={projectMenuClass(false)}>
                                <span className="sb-icon">◍</span>
                                Submit Cost
                            </div>
                        </div>
                    )}

                    <div className="sb-section">
                        <div className="sb-section-label">Recognition</div>
                        {recognition.map(item => (
                            <NavLink key={item.to} to={item.to} className={navClass}>
                                <span className="sb-icon">{ICONS[item.icon]}</span>
                                {item.label}
                            </NavLink>
                        ))}
                    </div>
                </>
            ) : (
                <>
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
                </>
            )}

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