import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    getBacklogItemById,
    getStatusBadgeColors,
    getTypeBadgeColors,
    initialsFromName,
} from './viewerBacklogMock';
import './ViewerWorkItemDetailPage.css';

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
    const projectName = location.state?.projectName || `Project ${id}`;

    const workItem = useMemo(() => getBacklogItemById(id, itemId), [id, itemId]);
    const [currentStatus, setCurrentStatus] = useState(normalizeStatus(workItem?.status));
    const [blockers, setBlockers] = useState(() => {
        const base = workItem?.blockedSummary
            ? [{
                id: `seed-${workItem.id}`,
                kind: 'blocker',
                description: workItem.blockedSummary,
                impact: 'Impacts the authentication flow and delays the viewer release.',
                severity: 'critical',
                createdAt: 'Today · 09:40',
                isActive: true,
            }]
            : [];

        return base;
    });
    const [form, setForm] = useState({
        kind: 'blocker',
        description: '',
        impact: '',
        severity: 'medium',
    });
    const [errors, setErrors] = useState({});
    const [timeline, setTimeline] = useState([
        {
            id: 'created',
            title: 'Work item created',
            detail: 'Added to Sprint 4 backlog for the viewer project.',
            time: 'Today · 08:10',
        },
    ]);

    useEffect(() => {
        setCurrentStatus(normalizeStatus(workItem?.status));
        setBlockers(workItem?.blockedSummary
            ? [{
                id: `seed-${workItem.id}`,
                kind: 'blocker',
                description: workItem.blockedSummary,
                impact: 'Impacts the authentication flow and delays the viewer release.',
                severity: 'critical',
                createdAt: 'Today · 09:40',
                isActive: true,
            }]
            : []);
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
    const activeBlocker = blockers.find((blocker) => blocker.isActive);
    const activeCritical = activeBlocker?.severity === 'critical';
    const severity = severityMeta(activeBlocker?.severity || form.severity);

    function handleSubmit(event) {
        event.preventDefault();

        const nextErrors = {};
        if (!form.description.trim()) nextErrors.description = 'Description is required.';
        if (!form.impact.trim()) nextErrors.impact = 'Impact is required.';

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        const createdAt = new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        const newBlocker = {
            id: `${workItem.id}-${Date.now()}`,
            kind: form.kind,
            description: form.description.trim(),
            impact: form.impact.trim(),
            severity: form.severity,
            createdAt,
            isActive: true,
        };

        setBlockers((current) => current.map((blocker) => ({ ...blocker, isActive: false })).concat(newBlocker));
        setTimeline((current) => [
            {
                id: `timeline-${Date.now()}`,
                title: `${form.kind === 'implication' ? 'Implication' : 'Blocker'} registered`,
                detail: `${form.description.trim()} · ${severityMeta(form.severity).label}`,
                time: createdAt,
            },
            ...current,
        ]);
        setForm({ kind: 'blocker', description: '', impact: '', severity: 'medium' });
        setErrors({});
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

                        <div className="vwid-card vwid-alert-card">
                            <div className="vwid-card-head vwid-card-head-tight">
                                <div>
                                    <div className="vwid-card-label">Blockers & Implications</div>
                                    <div className="vwid-card-note">CA-01 to CA-04 ready in UI, local-only.</div>
                                </div>
                                <span className="vwid-scope-pill">{blockers.length} records</span>
                            </div>

                            {activeBlocker ? (
                                <div className="vwid-active-blocker" data-severity={activeBlocker.severity}>
                                    <div className="vwid-active-blocker-head">
                                        <span className="vwid-active-badge">Active {activeBlocker.kind}</span>
                                        <span className="vwid-date">{activeBlocker.createdAt}</span>
                                    </div>
                                    <div className="vwid-blocker-title">{activeBlocker.description}</div>
                                    <div className="vwid-blocker-impact">{activeBlocker.impact}</div>
                                    <div className="vwid-blocker-footer">
                                        <span className="vwid-meta-chip" style={{ color: severity.color, backgroundColor: severity.bg }}>{severity.label}</span>
                                        <button className="vwid-secondary-btn" onClick={() => setBlockers((current) => current.map((blocker) => ({ ...blocker, isActive: false })))}>
                                            Mark resolved
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="vwid-empty-state">No active blockers. Use the form below to register one.</div>
                            )}

                            <form className="vwid-form" onSubmit={handleSubmit}>
                                <div className="vwid-form-row">
                                    <div className="vwid-field">
                                        <label>Type</label>
                                        <select value={form.kind} onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value }))}>
                                            <option value="blocker">Blocker</option>
                                            <option value="implication">Implication</option>
                                        </select>
                                    </div>
                                    <div className="vwid-field">
                                        <label>Severity</label>
                                        <select value={form.severity} onChange={(event) => setForm((current) => ({ ...current, severity: event.target.value }))}>
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
                                    />
                                    {errors.impact && <span className="vwid-error-text">{errors.impact}</span>}
                                </div>

                                <div className="vwid-form-actions">
                                    <button type="button" className="vwid-secondary-btn" onClick={() => setForm({ kind: 'blocker', description: '', impact: '', severity: 'medium' })}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="vwid-primary-btn">
                                        Register Blocker
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="vwid-card">
                            <div className="vwid-card-head vwid-card-head-tight">
                                <div>
                                    <div className="vwid-card-label">Activity</div>
                                    <div className="vwid-card-note">Local timeline for the current item.</div>
                                </div>
                            </div>

                            <div className="vwid-timeline">
                                {timeline.map((entry) => (
                                    <div key={entry.id} className="vwid-timeline-item">
                                        <div className="vwid-timeline-dot" />
                                        <div>
                                            <div className="vwid-timeline-title">{entry.title}</div>
                                            <div className="vwid-timeline-detail">{entry.detail}</div>
                                            <div className="vwid-date">{entry.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
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

                        <div className={`vwid-risk-card ${activeCritical ? 'is-critical' : ''}`}>
                            <div className="vwid-card-label">Points Preview</div>
                            <div className="vwid-risk-main">
                                <div>
                                    <div className="vwid-risk-value">{workItem.storyPoints + (activeCritical ? 6 : blockers.length * 2)} pts</div>
                                    <div className="vwid-risk-caption">Visual impact if blocker remains active</div>
                                </div>
                                <span className="vwid-meta-chip" style={{ color: severity.color, backgroundColor: severity.bg }}>{severity.label}</span>
                            </div>
                            <div className="vwid-risk-note">
                                {activeCritical ? 'Active critical blocker contributes to project risk visuals and should surface to the PM.' : 'No critical blocker active right now.'}
                            </div>
                        </div>

                        <div className="vwid-summary-card vwid-audit-card">
                            <div className="vwid-card-label">Audit Trail</div>
                            <div className="vwid-audit-item">UI-only record linked to item #{workItem.id}</div>
                            <div className="vwid-audit-item">Project scope: #{id}</div>
                            <div className="vwid-audit-item">Backend approval/rejection flow will be added later.</div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}