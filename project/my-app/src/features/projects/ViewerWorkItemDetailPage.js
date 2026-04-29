import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuthContext } from '../../shared/context/AuthContext';
import api from '../../config/api';
import './ViewerWorkItemDetailPage.css';

// ── Helpers (antes venían del mock) ──────────────────────────────────────────
function getStatusBadgeColors(status) {
    if (status === 'done'        || status === 'Done')        return { color: '#3C9A57', bg: '#E9F7ED' };
    if (status === 'in_progress' || status === 'In Progress') return { color: '#3162D1', bg: '#E7EEFF' };
    return { color: '#7E8693', bg: '#EEF1F5' };
}
function getTypeBadgeColors(type) {
    if (type === 'bug'        || type === 'Bug')        return { color: '#B94A48', bg: '#FCE9E9' };
    if (type === 'user_story' || type === 'User Story') return { color: '#3162D1', bg: '#E7EEFF' };
    return { color: '#3C9A57', bg: '#E9F7ED' };
}
function initialsFromName(name = '') {
    const parts = String(name).split(' ').filter(Boolean);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

// ── Adapta el item real de la API al shape que usa el componente ─────────────
function adaptItem(raw, projectId) {
    if (!raw) return null;
    return {
        id:          raw.id_work_item,
        title:       raw.title        || '(sin título)',
        description: raw.description  || '',
        type:        raw.type         || 'task',
        status:      raw.status       || 'todo',
        storyPoints: raw.story_points ?? 0,
        assignee:    raw.assignee?.full_name || raw.assignee?.username || 'Sin asignar',
        assigneeId:  raw.assignee_id  || null,
        sprintLabel: raw.id_sprint ? `Sprint #${raw.id_sprint}` : `Proyecto #${projectId}`,
        targetDate:  raw.end_date     || null,
    };
}

function severityMeta(severity) {
    if (severity === 'critical') return { label: 'Crítico', color: '#B71C1C', bg: '#FDECEC' };
    if (severity === 'medium') return { label: 'Medio', color: '#8A5A00', bg: '#FFF3D9' };
    return { label: 'Bajo', color: '#2E7D32', bg: '#E7F6EA' };
}

function normalizeStatus(status) {
    if (status === 'In Progress' || status === 'in_progress') return 'in_progress';
    if (status === 'Done' || status === 'done') return 'done';
    return 'todo';
}

function statusLabel(status) {
    if (status === 'done') return 'Done';
    if (status === 'in_progress') return 'In Progress';
    return 'To Do';
}

export default function ViewerWorkItemDetailPage() {
    const { id, itemId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const projectName = location.state?.projectName || `Project ${id}`;

    // Item real pasado desde ViewerProjectBacklogPage via location.state
    const workItem = adaptItem(location.state?.item, id);
    const isMyItem = workItem?.assigneeId === user?.id;
    const [currentStatus, setCurrentStatus] = useState(normalizeStatus(workItem?.status));
    const [blockers, setBlockers] = useState([]);
    const [loadingBlockers, setLoadingBlockers] = useState(true);
    const [form, setForm] = useState({
        kind: 'blocker',
        description: '',
        impact: '',
        severity: 'medium',
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [timeline, setTimeline] = useState([
        {
            id: 'created',
            title: 'Work item created',
            detail: 'Added to Sprint 4 backlog for the viewer project.',
            time: 'Today · 08:10',
        },
    ]);

    // Cargar bloqueadores desde API
    useEffect(() => {
        if (!workItem?.id) {
            setLoadingBlockers(false);
            return;
        }

        async function loadBlockers() {
            try {
                const { res, data } = await api.get(`/blockers?work_item_id=${workItem.id}`);
                if (res.ok) {
                    setBlockers(data.blockers || []);
                } else {
                    console.error('Error cargando bloqueadores:', data.message);
                }
            } catch (err) {
                console.error('Error de conexión al cargar bloqueadores:', err);
            } finally {
                setLoadingBlockers(false);
            }
        }

        loadBlockers();
    }, [workItem?.id]);

    useEffect(() => {
        setCurrentStatus(normalizeStatus(workItem?.status));
        setTimeline([
            {
                id: 'created',
                title: 'Work item created',
                detail: 'Added to Sprint 4 backlog for the viewer project.',
                time: 'Today · 08:10',
            },
        ]);
    }, [workItem]);

    if (!workItem) {
        return (
            <div className="vwid-page">
                <div className="vwid-empty-shell">
                    <h1 className="vwid-title">Work item not found</h1>
                    <button className="vwid-secondary-btn" onClick={() => navigate(`/projects/${id}/backlog`, { state: { projectName } })}>
                        Back to Backlog
                    </button>
                </div>
            </div>
        );
    }

    const type = getTypeBadgeColors(workItem.type);
    const status = getStatusBadgeColors(statusLabel(currentStatus));

    function handleSubmit(event) {
        event.preventDefault();

        const nextErrors = {};
        if (!form.description.trim()) nextErrors.description = 'Description is required.';
        if (!form.impact.trim()) nextErrors.impact = 'Impact is required.';

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        submitBlocker();
    }

    async function submitBlocker() {
        setSubmitting(true);
        try {
            const { res, data } = await api.post('/blockers', {
                id_work_item: workItem.id,
                id_project: parseInt(id),
                kind: form.kind,
                severity: form.severity,
                description: form.description.trim(),
                impact: form.impact.trim(),
            });

            if (res.ok) {
                // Agregar el nuevo bloqueador a la lista
                setBlockers(current => [data.blocker, ...current]);

                // Actualizar timeline
                setTimeline((current) => [
                    {
                        id: `timeline-${Date.now()}`,
                        title: `${form.kind === 'implication' ? 'Implication' : 'Blocker'} registered`,
                        detail: `${form.description.trim()} · ${severityMeta(form.severity).label} (Pending approval)`,
                        time: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                    },
                    ...current,
                ]);

                // Limpiar formulario
                setForm({ kind: 'blocker', description: '', impact: '', severity: 'medium' });
                setErrors({});
            } else {
                setErrors({ submit: data.message || 'Error creating blocker' });
            }
        } catch (error) {
            setErrors({ submit: 'Error de conexión' });
            console.error('Error submitting blocker:', error);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="vwid-page">
            <div className="vwid-top-bar">
                <div className="vwid-breadcrumb">
                    <span className="vwid-crumb-accent">{projectName}</span>
                    <span>/</span>
                    <span className="vwid-crumb-accent">{workItem.sprintLabel}</span>
                    <span>/</span>
                    <span>Work Item Detail</span>
                </div>
                <button className="vwid-secondary-btn" onClick={() => navigate(`/projects/${id}/backlog`, { state: { projectName } })}>
                    ← Back to Backlog
                </button>
            </div>

            <div className="vwid-content-wrap">
                <div className="vwid-header-card">
                    <div className="vwid-header-left">
                        <span className="vwid-kicker">{workItem.type}</span>
                        <h1 className="vwid-title">{workItem.title}</h1>
                        <p className="vwid-description">{workItem.description}</p>
                    </div>

                    <div className="vwid-header-meta">
                        <div className="vwid-meta-chip" style={{ color: type.color, backgroundColor: type.bg }}>{workItem.type}</div>
                        <div className="vwid-meta-chip" style={{ color: status.color, backgroundColor: status.bg }}>{currentStatus.replace('_', ' ')}</div>
                    </div>
                </div>

                <div className="vwid-grid">
                    <section className="vwid-main-column">
                        <div className="vwid-card">
                            <div className="vwid-card-head">
                                <div>
                                    <div className="vwid-card-label">Status</div>
                                    <div className="vwid-card-note">Visual controls only, no backend persistence yet.</div>
                                </div>
                                <div className="vwid-pill-row">
                                    {['todo', 'in_progress', 'done'].map((value) => (
                                        <button
                                            key={value}
                                            className={`vwid-status-btn ${currentStatus === value ? 'is-active' : ''}`}
                                            onClick={() => {
                                                setCurrentStatus(value);
                                                setTimeline((current) => [
                                                    {
                                                        id: `status-${Date.now()}`,
                                                        title: 'Status changed locally',
                                                        detail: `Now set to ${statusLabel(value)}`,
                                                        time: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                                                    },
                                                    ...current,
                                                ]);
                                            }}
                                        >
                                            {statusLabel(value)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="vwid-info-grid">
                                <div>
                                    <span className="vwid-info-label">Assignee</span>
                                    <div className="vwid-assignee-wrap">
                                        <span className="vwid-avatar">{initialsFromName(workItem.assignee).toUpperCase()}</span>
                                        <span>{workItem.assignee}</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="vwid-info-label">Story Points</span>
                                    <div className="vwid-info-value">{workItem.storyPoints} SP</div>
                                </div>
                                <div>
                                    <span className="vwid-info-label">Target date</span>
                                    <div className="vwid-info-value vwid-warning">{workItem.targetDate}</div>
                                </div>
                                <div>
                                    <span className="vwid-info-label">Project link</span>
                                    <div className="vwid-info-value">Item #{workItem.id} · Project #{id}</div>
                                </div>
                            </div>
                        </div>

                        {isMyItem && (
                            <div className="vwid-card vwid-alert-card">
                                <div className="vwid-card-head vwid-card-head-tight">
                                    <div>
                                        <div className="vwid-card-label">Blockers & Implications</div>
                                        <div className="vwid-card-note">Registrados y aprobados por el PM</div>
                                    </div>
                                    <span className="vwid-scope-pill">{blockers.length} records</span>
                                </div>

                                {loadingBlockers ? (
                                    <div className="vwid-empty-state">Cargando bloqueadores...</div>
                                ) : blockers.length > 0 ? (
                                    <div style={{ marginBottom: 24 }}>
                                        {blockers.map((blocker) => {
                                            const blockerSeverity = severityMeta(blocker.severity);
                                            const statusLabel = blocker.approval_status === 'pending' ? 'Pending approval' :
                                                blocker.approval_status === 'approved' ? 'Approved by PM' : 'Rejected';
                                            const statusColor = blocker.approval_status === 'pending' ? '#8A5A00' :
                                                blocker.approval_status === 'approved' ? '#2E7D32' : '#B71C1C';
                                            const statusBg = blocker.approval_status === 'pending' ? '#FFF3D9' :
                                                blocker.approval_status === 'approved' ? '#E7F6EA' : '#FDECEC';

                                            return (
                                                <div key={blocker.id_blocker} className="vwid-active-blocker" data-severity={blocker.severity} style={{ marginBottom: 12 }}>
                                                    <div className="vwid-active-blocker-head">
                                                        <span className="vwid-active-badge">{blocker.kind === 'implication' ? 'Implication' : 'Blocker'}</span>
                                                        <span className="vwid-date">{new Date(blocker.created_at).toLocaleDateString()} · {new Date(blocker.created_at).toLocaleTimeString()}</span>
                                                    </div>
                                                    <div className="vwid-blocker-title">{blocker.description}</div>
                                                    <div className="vwid-blocker-impact">{blocker.impact}</div>
                                                    <div className="vwid-blocker-footer">
                                                        <span className="vwid-meta-chip" style={{ color: blockerSeverity.color, backgroundColor: blockerSeverity.bg }}>{blockerSeverity.label}</span>
                                                        <span className="vwid-meta-chip" style={{ color: statusColor, backgroundColor: statusBg }}>{statusLabel}</span>
                                                        {blocker.approval_status === 'rejected' && blocker.rejected_reason && (
                                                            <span style={{ fontSize: 11, color: '#B71C1C' }}>Razón: {blocker.rejected_reason}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="vwid-empty-state">No blockers registered. Use the form below to register one.</div>
                                )}

                                <form className="vwid-form" onSubmit={handleSubmit}>
                                    {errors.submit && (
                                        <div style={{
                                            padding: '10px 12px',
                                            marginBottom: 12,
                                            borderRadius: 4,
                                            backgroundColor: '#FDECEC',
                                            border: '1px solid #FFCDD2',
                                            color: '#B71C1C',
                                            fontSize: 12,
                                        }}>
                                            {errors.submit}
                                        </div>
                                    )}
                                    <div className="vwid-form-row">
                                        <div className="vwid-field">
                                            <label>Type</label>
                                            <select 
                                                value={form.kind} 
                                                onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value }))}
                                                disabled={submitting}
                                            >
                                                <option value="blocker">Blocker</option>
                                                <option value="implication">Implication</option>
                                            </select>
                                        </div>
                                        <div className="vwid-field">
                                            <label>Severity</label>
                                            <select 
                                                value={form.severity} 
                                                onChange={(event) => setForm((current) => ({ ...current, severity: event.target.value }))}
                                                disabled={submitting}
                                            >
                                                <option value="low">Bajo</option>
                                                <option value="medium">Medio</option>
                                                <option value="critical">Crítico</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="vwid-field">
                                        <label>Blocker description *</label>
                                        <textarea
                                            rows="3"
                                            value={form.description}
                                            onChange={(event) => {
                                                setForm((current) => ({ ...current, description: event.target.value }));
                                                if (errors.description) setErrors((current) => ({ ...current, description: '' }));
                                            }}
                                            placeholder="What is blocking progress? Be specific."
                                            disabled={submitting}
                                        />
                                        {errors.description && <span className="vwid-error-text">{errors.description}</span>}
                                    </div>

                                    <div className="vwid-field">
                                        <label>Implication / Impact *</label>
                                        <textarea
                                            rows="3"
                                            value={form.impact}
                                            onChange={(event) => {
                                                setForm((current) => ({ ...current, impact: event.target.value }));
                                                if (errors.impact) setErrors((current) => ({ ...current, impact: '' }));
                                            }}
                                            placeholder="What will happen if this is not resolved?"
                                            disabled={submitting}
                                        />
                                        {errors.impact && <span className="vwid-error-text">{errors.impact}</span>}
                                    </div>

                                    <div className="vwid-form-actions">
                                        <button 
                                            type="button" 
                                            className="vwid-secondary-btn" 
                                            onClick={() => setForm({ kind: 'blocker', description: '', impact: '', severity: 'medium' })}
                                            disabled={submitting}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="vwid-primary-btn"
                                            disabled={submitting}
                                        >
                                            {submitting ? 'Registering...' : 'Register Blocker'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                    </section>

                    <aside className="vwid-side-column">
                        <div className="vwid-summary-card">
                            <div className="vwid-card-label">Details</div>
                            <div className="vwid-summary-row"><span>Type</span><strong>{workItem.type}</strong></div>
                            <div className="vwid-summary-row"><span>Status</span><strong>{statusLabel(currentStatus)}</strong></div>
                            <div className="vwid-summary-row"><span>Story Points</span><strong>{workItem.storyPoints} SP</strong></div>
                            <div className="vwid-summary-row"><span>Assignee</span><strong>{workItem.assignee}</strong></div>
                            <div className="vwid-summary-row"><span>Sprint</span><strong>{workItem.sprintLabel}</strong></div>
                            <div className="vwid-summary-row"><span>Target</span><strong>{workItem.targetDate}</strong></div>
                        </div>

                        {isMyItem && (
                            <>
                                <div className={`vwid-risk-card ${blockers.some(b => b.severity === 'critical' && b.approval_status === 'approved') ? 'is-critical' : ''}`}>
                                    <div className="vwid-card-label">Blockers Status</div>
                                    <div className="vwid-risk-main">
                                        <div>
                                            <div className="vwid-risk-value">{blockers.filter(b => b.approval_status === 'approved').length} approved</div>
                                            <div className="vwid-risk-caption">Registered and approved blockers</div>
                                        </div>
                                    </div>
                                    <div className="vwid-risk-note">
                                        {blockers.some(b => b.severity === 'critical' && b.approval_status === 'approved') ? 'Critical blocker approved - should surface to the PM.' : 'No critical blockers approved.'}
                                    </div>
                                </div>

                                <div className="vwid-summary-card vwid-audit-card">
                                    <div className="vwid-card-label">Audit Trail</div>
                                    <div className="vwid-audit-item">Blockers linked to item #{workItem.id}</div>
                                    <div className="vwid-audit-item">Project scope: #{id}</div>
                                    <div className="vwid-audit-item">PM approval required for blockers to be official</div>
                                </div>
                            </>
                        )}
                    </aside>
                </div>
            </div>
        </div>
    );
}