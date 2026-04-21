export const ICONS = {
    dashboard: '▣',
    projects: '▭',
    users: '◉',
    audit: '≡',
    leader: '◇',
    personal: '◦',
};

export const NAV_ITEMS = [
    { to: '/home', label: 'Inicio', icon: 'dashboard', section: 'general' },
    { to: '/projects', label: 'Proyectos', icon: 'projects', section: 'general' },
    { to: '/users', label: 'Usuarios', icon: 'users', section: 'general', roles: ['pm', 'admin'] },
    { to: '/audit', label: 'Bitácora', icon: 'audit', section: 'inteligencia' },
    { to: '/leaderboard', label: 'Clasificación', icon: 'leader', section: 'inteligencia' },
];

export const VIEWER_NAV_ITEMS = [
    { to: '/home', label: 'Personal Dashboard', icon: 'personal', section: 'my_work' },
    { to: '/projects', label: 'Projects', icon: 'projects', section: 'my_work' },
    { to: '/leaderboard', label: 'Leaderboard', icon: 'leader', section: 'recognition' },
];