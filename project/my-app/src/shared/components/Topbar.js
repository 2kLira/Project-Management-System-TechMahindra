import { useAuthContext } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import './Topbar.css';

/** Iniciales del username para el avatar */
function getInitials(username = '') {
    return username
        .split(/[\s_-]+/)
        .slice(0, 2)
        .map(w => w[0] ?? '')
        .join('')
        .toUpperCase() || '?';
}

export default function Topbar() {
    const { user } = useAuthContext();
    const isViewer = user?.role === 'viewer';

    return (
        <header className="tb-topbar">
            <div className="tb-right">
                {/* Campana de notificaciones (oculta para viewer) */}
                {!isViewer && <NotificationBell />}
                <div className="tb-user">
                    <div className="tb-user-avatar">{getInitials(user?.username)}</div>
                    <div className="tb-user-meta">
                        <span className="tb-user-name">{user?.username}</span>
                        <span className="tb-user-role">{user?.role}</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
