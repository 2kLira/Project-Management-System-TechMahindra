import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import api from '../../config/api';
import { KIND_ICONS, formatRelativeTime } from '../../features/notifications/notifications.utils';
import { ReactComponent as BellIcon } from './bell-alt-1.svg';
import './NotificationBell.css';

const POLL_MS = 60_000;

export default function NotificationBell() {
    const { user } = useAuthContext();
    const navigate = useNavigate();

    const [unreadCount, setUnreadCount] = useState(0);
    const [items, setItems] = useState([]);
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    // Solo cuenta no leídas; no muta la lista (no parpadea con el dropdown abierto)
    const fetchUnreadCount = useCallback(async () => {
        if (!user?.id) return;
        const { res, data } = await api.get('/notifications?unreadOnly=true');
        if (res.ok) setUnreadCount(data.unreadCount ?? (data.items?.length ?? 0));
    }, [user?.id]);

    // Polling mientras haya usuario
    useEffect(() => {
        if (!user?.id) return undefined;
        fetchUnreadCount();
        const t = setInterval(fetchUnreadCount, POLL_MS);
        return () => clearInterval(t);
    }, [user?.id, fetchUnreadCount]);

    // Cerrar al click afuera
    useEffect(() => {
        if (!open) return undefined;
        function onClick(e) {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [open]);

    async function toggleOpen() {
        const next = !open;
        setOpen(next);
        if (next) {
            const { res, data } = await api.get('/notifications');
            if (res.ok) setItems(data.items ?? []);
        }
    }

    async function handleItemClick(item) {
        // Optimista: marca leída en local
        if (item.read_at == null) {
            setItems(prev => prev.map(n =>
                n.id_notifications === item.id_notifications
                    ? { ...n, read_at: new Date().toISOString() }
                    : n
            ));
            setUnreadCount(c => Math.max(0, c - 1));
            // Si el PATCH falla, re-sincroniza el contador en vez de esperar al polling.
            api.patch(`/notifications/${item.id_notifications}/read`)
                .then(({ res }) => { if (!res.ok) fetchUnreadCount(); })
                .catch(() => fetchUnreadCount());
        }
        setOpen(false);
        if (item.id_project) navigate(`/projects/${item.id_project}/view`);
    }

    async function handleMarkAll() {
        setItems(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
        setUnreadCount(0);
        const { res } = await api.patch('/notifications/read-all');
        if (!res.ok) fetchUnreadCount(); // re-sincroniza si el servidor falló
    }

    const badge = unreadCount > 9 ? '9+' : String(unreadCount);

    return (
        <div className="nb-wrap" ref={wrapRef}>
            <button className="nb-btn" onClick={toggleOpen} aria-label="Notificaciones">
                <BellIcon className="nb-icon" />
                {unreadCount > 0 && <span className="nb-badge">{badge}</span>}
            </button>

            {open && (
                <div className="nb-dropdown">
                    <div className="nb-header">
                        <span className="nb-title">Notificaciones</span>
                        <button className="nb-markall" onClick={handleMarkAll}>
                            Marcar todas como leídas
                        </button>
                    </div>

                    {items.length === 0 ? (
                        <div className="nb-empty">No tienes notificaciones</div>
                    ) : (
                        <ul className="nb-list">
                            {items.map(item => (
                                <li
                                    key={item.id_notifications}
                                    className={'nb-item' + (item.read_at == null ? ' nb-item-unread' : '')}
                                    onClick={() => handleItemClick(item)}
                                >
                                    <span className="nb-item-dot">
                                        {item.read_at == null ? '●' : ''}
                                    </span>
                                    <div className="nb-item-body">
                                        <div className="nb-item-top">
                                            <span className="nb-item-kind">{KIND_ICONS[item.kind] || '•'}</span>
                                            <span className="nb-item-subject">{item.subject}</span>
                                            {item.project_name && (
                                                <span className="nb-item-project">· {item.project_name}</span>
                                            )}
                                        </div>
                                        <div className="nb-item-write">{item.write}</div>
                                        <div className="nb-item-time">{formatRelativeTime(item.created_at)}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
