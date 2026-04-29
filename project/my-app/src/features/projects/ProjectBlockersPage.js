import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../../config/api';

function severityMeta(severity) {
    if (severity === 'critical') return { label: 'Crítico', color: '#B71C1C', bg: '#FDECEC' };
    if (severity === 'medium') return { label: 'Medio', color: '#8A5A00', bg: '#FFF3D9' };
    return { label: 'Bajo', color: '#2E7D32', bg: '#E7F6EA' };
}

function approvalStatusMeta(status) {
    if (status === 'approved') return { label: 'Aprobado', color: '#2E7D32', bg: '#E7F6EA' };
    if (status === 'rejected') return { label: 'Rechazado', color: '#B71C1C', bg: '#FDECEC' };
    return { label: 'Pendiente', color: '#8A5A00', bg: '#FFF3D9' };
}

function formatDate(value) {
    if (!value) return 'Sin fecha';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
        ? value
        : parsed.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function ProjectBlockersPage() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const projectName = location.state?.projectName || `Proyecto ${id}`;

    const [blockers, setBlockers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        let active = true;

        async function loadBlockers() {
            try {
                const { res, data } = await api.get(`/blockers?project_id=${id}&approval_status=pending`);
                if (!active) return;

                if (res.ok) {
                    setBlockers(data.blockers || []);
                } else {
                    setMessage({ text: data.message || 'Error cargando bloqueadores', type: 'error' });
                }
            } catch {
                if (active) setMessage({ text: 'Error de conexión', type: 'error' });
            } finally {
                if (active) setLoading(false);
            }
        }

        loadBlockers();
        return () => { active = false; };
    }, [id]);

    async function refreshBlockers() {
        const { res, data } = await api.get(`/blockers?project_id=${id}&approval_status=pending`);
        if (res.ok) {
            setBlockers(data.blockers || []);
        } else {
            setMessage({ text: data.message || 'Error recargando bloqueadores', type: 'error' });
        }
    }

    async function approveBlocker(blockerId) {
        setMessage({ text: '', type: '' });
        try {
            const { res, data } = await api.patch(`/blockers/${blockerId}/approve`, { approval_status: 'approved' });
            if (res.ok) {
                setMessage({ text: 'Bloqueador aprobado', type: 'success' });
                await refreshBlockers();
            } else {
                setMessage({ text: data.message || 'Error aprobando bloqueador', type: 'error' });
            }
        } catch {
            setMessage({ text: 'Error de conexión', type: 'error' });
        }
    }

    async function rejectBlocker(blockerId) {
        const reason = window.prompt('Motivo del rechazo');
        if (!reason || !reason.trim()) return;

        setMessage({ text: '', type: '' });
        try {
            const { res, data } = await api.patch(`/blockers/${blockerId}/reject`, {
                approval_status: 'rejected',
                rejected_reason: reason.trim(),
            });
            if (res.ok) {
                setMessage({ text: 'Bloqueador rechazado', type: 'success' });
                await refreshBlockers();
            } else {
                setMessage({ text: data.message || 'Error rechazando bloqueador', type: 'error' });
            }
        } catch {
            setMessage({ text: 'Error de conexión', type: 'error' });
        }
    }

    return (
        <div style={s.page}>
            <div style={s.topBar}>
                <div style={s.breadcrumb}>
                    <button style={s.crumbBtn} onClick={() => navigate('/projects')}>Proyectos</button>
                    <span style={s.sep}>/</span>
                    <button style={s.crumbBtn} onClick={() => navigate(`/projects/${id}/view`, { state: { projectName } })}>
                        {projectName}
                    </button>
                    <span style={s.sep}>/</span>
                    <span style={s.crumbCurrent}>Bloqueadores pendientes</span>
                </div>

                <button style={s.backBtn} onClick={() => navigate(`/projects/${id}/view`, { state: { projectName } })}>
                    ← Volver al proyecto
                </button>
            </div>

            <div style={s.body}>
                <div style={s.headerCard}>
                    <div>
                        <div style={s.kicker}>PM review</div>
                        <h1 style={s.title}>Bloqueadores pendientes</h1>
                        <p style={s.subtitle}>Revisa las implicaciones y bloqueadores registrados por los viewers antes de aprobarlos o rechazarlos.</p>
                    </div>
                    <div style={s.tag}>Proyecto {id}</div>
                </div>

                {message.text && (
                    <div style={message.type === 'error' ? s.errorBox : s.successBox}>
                        {message.text}
                    </div>
                )}

                {loading ? (
                    <div style={s.emptyState}>Cargando bloqueadores...</div>
                ) : blockers.length === 0 ? (
                    <div style={s.emptyState}>No hay bloqueadores pendientes en este proyecto.</div>
                ) : (
                    <div style={s.list}>
                        {blockers.map((blocker) => {
                            const severity = severityMeta(blocker.severity);
                            const approval = approvalStatusMeta(blocker.approval_status);
                            const workItem = blocker.work_item || {};
                            const sprint = blocker.sprint || {};

                            return (
                                <article key={blocker.id_blocker} style={s.card}>
                                    <div style={s.cardTop}>
                                        <div>
                                            <div style={s.cardLabel}>{blocker.kind === 'implication' ? 'Implication' : 'Blocker'}</div>
                                            <div style={s.cardTitle}>{blocker.description}</div>
                                        </div>
                                        <div style={s.chips}>
                                            <span style={{ ...s.chip, color: severity.color, backgroundColor: severity.bg }}>{severity.label}</span>
                                            <span style={{ ...s.chip, color: approval.color, backgroundColor: approval.bg }}>{approval.label}</span>
                                        </div>
                                    </div>

                                    <div style={s.cardBody}>{blocker.impact}</div>

                                    <div style={s.metaGrid}>
                                        <div style={s.metaItem}><span>Work item</span><strong>{workItem.title || `Item #${blocker.id_work_item}`}</strong></div>
                                        <div style={s.metaItem}><span>Sprint</span><strong>{sprint.name || `Sprint #${workItem.id_sprint || 'N/A'}`}</strong></div>
                                        <div style={s.metaItem}><span>Creado por</span><strong>{blocker.created_by_user?.full_name || blocker.created_by_user?.username || 'N/D'}</strong></div>
                                        <div style={s.metaItem}><span>Fecha</span><strong>{formatDate(blocker.created_at)}</strong></div>
                                    </div>

                                    <div style={s.actions}>
                                        <button style={s.approveBtn} onClick={() => approveBlocker(blocker.id_blocker)}>Aprobar</button>
                                        <button style={s.rejectBtn} onClick={() => rejectBlocker(blocker.id_blocker)}>Rechazar</button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

const s = {
    page: { minHeight: '100vh', backgroundColor: '#F5F5F4', fontFamily: "'DM Sans','Helvetica Neue',sans-serif", color: '#1A1A1A' },
    topBar: { backgroundColor: '#FFF', borderBottom: '1px solid #E5E5E3', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    breadcrumb: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#888', flexWrap: 'wrap' },
    crumbBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#888', padding: 0 },
    sep: { color: '#CCC' },
    crumbCurrent: { color: '#1A1A1A', fontWeight: 500 },
    backBtn: { height: 36, padding: '0 16px', backgroundColor: '#1A1A1A', color: '#FFF', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    body: { padding: 32, maxWidth: 1320 },
    headerCard: { backgroundColor: '#FFF', border: '1px solid #E7E4DD', borderRadius: 8, padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 },
    kicker: { fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8A8A8A', fontWeight: 700, marginBottom: 8 },
    title: { fontSize: 28, lineHeight: 1.1, margin: 0, marginBottom: 10 },
    subtitle: { fontSize: 13, color: '#6C6C6C', lineHeight: 1.5, maxWidth: 780, margin: 0 },
    tag: { display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '6px 10px', fontSize: 10, fontWeight: 700, color: '#2453C9', backgroundColor: '#E7EEFF' },
    errorBox: { padding: '10px 14px', marginBottom: 14, borderRadius: 4, fontSize: 13, backgroundColor: '#FFF5F5', border: '1px solid #FFCDD2', color: '#B71C1C' },
    successBox: { padding: '10px 14px', marginBottom: 14, borderRadius: 4, fontSize: 13, backgroundColor: '#F1F8E9', border: '1px solid #C5E1A5', color: '#33691E' },
    emptyState: { padding: 24, backgroundColor: '#FFF', border: '1px solid #E7E4DD', borderRadius: 8, color: '#7B7B7B', fontSize: 13 },
    list: { display: 'grid', gap: 12 },
    card: { backgroundColor: '#FFF', border: '1px solid #E7E4DD', borderRadius: 8, padding: 18 },
    cardTop: { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 12 },
    cardLabel: { fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8A8A8A', fontWeight: 700, marginBottom: 6 },
    cardTitle: { fontSize: 16, fontWeight: 700, color: '#2C2C2C', lineHeight: 1.35 },
    chips: { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' },
    chip: { display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '5px 10px', fontSize: 11, fontWeight: 700 },
    cardBody: { fontSize: 13, color: '#6C6C6C', lineHeight: 1.55, marginBottom: 14 },
    metaGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 14 },
    metaItem: { display: 'grid', gap: 4, padding: 12, borderRadius: 6, backgroundColor: '#FAF8F5', border: '1px solid #F0EAE0' },
    actions: { display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' },
    approveBtn: { height: 36, padding: '0 16px', border: 'none', borderRadius: 4, backgroundColor: '#D92F47', color: '#FFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    rejectBtn: { height: 36, padding: '0 16px', border: '1px solid #DEDAD0', borderRadius: 4, backgroundColor: '#FFF', color: '#444', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
};