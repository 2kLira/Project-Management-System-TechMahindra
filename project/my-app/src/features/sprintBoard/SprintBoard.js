import { useEffect, useState } from 'react';
import "./SprintBoard.css";
import { useLocation, useParams } from 'react-router-dom';
import api from '../../config/api';
import { useAuthContext } from '../../shared/context/AuthContext';

// ─── MOCK DATA (hasta que el API de work items esté listo) ─────────────────────
const INITIAL_COLUMNS = {
    todo: {
        id: 'todo', label: 'TO DO', color: 'neutral',
        cards: [
            { id: 'US-14', type: 'User Story', title: 'Implement OTP login flow for mobile',      assignee: 'LC', sp: 8,  due: 'Mar 15', tag: null },
            { id: 'T-31',  type: 'Task',       title: 'Write unit tests for payment gateway',     assignee: 'BK', sp: 5,  due: 'Mar 18', tag: null },
            { id: 'B-07',  type: 'Bug',        title: 'Session timeout not clearing cookies',     assignee: 'AD', sp: 3,  due: 'Mar 12', tag: 'critical' },
            { id: 'US-15', type: 'User Story', title: 'User profile edit with document upload',   assignee: 'JR', sp: 13, due: 'Mar 20', tag: null },
        ],
    },
    inprogress: {
        id: 'inprogress', label: 'IN PROGRESS', color: 'blue',
        cards: [
            { id: 'US-12', type: 'User Story', title: 'Dashboard analytics with real-time charts', assignee: 'LC', sp: 21, due: 'Mar 17', tag: 'blocker', blockerMsg: 'Blocker: API rate limits exceeded' },
            { id: 'T-25',  type: 'Task',       title: 'Database index optimization for reports',   assignee: 'BK', sp: 5,  due: 'Mar 14', tag: null },
            { id: 'B-06',  type: 'Bug',        title: 'PDF export formatting breaks on Safari',    assignee: 'AD', sp: 3,  due: 'Mar 13', tag: null },
        ],
    },
    done: {
        id: 'done', label: 'DONE', color: 'green',
        cards: [
            { id: 'T-27',  type: 'Task',       title: 'Set up Sprint 4 environment',               assignee: 'JR', sp: null, closed: 'Closed Mar 3', bonus: false },
            { id: 'US-11', type: 'User Story', title: 'Password reset with email verification',    assignee: 'LC', sp: null, closed: 'Closed Mar 5', bonus: true  },
        ],
    },
};

const AVATAR_COLORS = { LC: '#5e3ea1', BK: '#1d5fa8', AD: '#b05c00', JR: '#d4382a' };

const BADGE_CLASS = {
    'User Story': 'badge--user-story',
    'Task':       'badge--task',
    'Bug':        'badge--bug',
};

// ─── ICONS ────────────────────────────────────────────────────────────────────
const IconSearch = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>;
const IconFilter = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M7 12h10M11 18h2" /></svg>;
const IconClock = () => <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>;
const IconCheck = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>;
const IconWarn = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
const IconAlert = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2zm0 3.5L19.5 20h-15L12 5.5zM11 10v5h2v-5h-2zm0 7v2h2v-2h-2z" /></svg>;

// ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────────
const Avatar = ({ id }) => (
    <div className="avatar" style={{ background: AVATAR_COLORS[id] || '#888' }}>{id}</div>
);

const Badge = ({ type }) => (
    <span className={`badge ${BADGE_CLASS[type] || 'badge--task'}`}>{type}</span>
);

const Card = ({ card, done = false }) => (
    <div className={`card${done ? ' card--done' : ''}`}>
        <div className="card__top">
            <Badge type={card.type} />
            <span className="card__id">#{card.id}</span>
        </div>
        <div className={`card__title${done ? ' card__title--done' : ''}`}>{card.title}</div>

        {card.tag === 'blocker' && (
            <div className="tag-wrap">
                <span className="tag tag--blocker"><IconWarn />{card.blockerMsg}</span>
            </div>
        )}
        {card.tag === 'critical' && (
            <div className="tag-wrap">
                <span className="tag tag--critical"><IconAlert />Critical blocker</span>
            </div>
        )}

        <div className="card__footer">
            <Avatar id={card.assignee} />
            <div className="card__meta">
                {done ? (
                    <>
                        <span className="closed-tag"><IconCheck />{card.closed}</span>
                        {card.bonus && <span className="bonus-tag">(+bonus)</span>}
                    </>
                ) : (
                    <><IconClock />{card.sp} SP · Due {card.due}</>
                )}
            </div>
        </div>
    </div>
);

const Column = ({ col }) => {
    const isDone = col.id === 'done';
    return (
        <div className={`column column--${col.color}`}>
            <div className="column__header">
                <span>{col.label}</span>
                <span className="column__count">{col.cards.length}</span>
            </div>
            <div className="column__body">
                {col.cards.map(card => (
                    <Card key={card.id} card={card} done={isDone} />
                ))}
            </div>
        </div>
    );
};

// ─── FORM ────────────────────────────────────────────────────────────────────────
const FormField = ({ label, required, children }) => (
    <div className="form-group">
        <label className="form-label">{label}{required && <span> *</span>}</label>
        {children}
    </div>
);

const AddWorkItemForm = () => {

  const { id_sprint } = useParams();

    const [form, setForm] = useState({
        type: '', assignee: '', title: '', sp: 8, weight: 2,
        start_date: '', target_date: '', description: '', created_by: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]           = useState('');

    useEffect(() => {
        const uid = user?.id_user ?? user?.id;
        if (uid) set('created_by', uid);
    }, [user]);

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    async function handleSubmit() {
        if (!form.type || !form.title.trim() || !form.assignee) {
            setError('Tipo, título y asignado son obligatorios.');
            return;
        }
        setError('');
        setSubmitting(true);
        try {
            const res = await api.post(`/sprintBoard/${id_sprint}/createWorkItem`, form);
            if (res.res?.ok || res.data?.data) {
                onAdded?.();
                onCancel();
            } else {
                setError(res.data?.message || 'Error al crear el item.');
            }
        } catch {
            setError('Error de conexión.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="add-form">
            <div className="add-form__header">
                <span className="add-form__title">Add Work Item</span>
                <span className="add-form__note">RF-08, RF-09 · PM only</span>
            </div>

            <div className="add-form__body">
                {error && <div className="form-error">{error}</div>}

                {/* Row 1: Type | Sprint | Assignee */}
                <div className="form-row">
                    <FormField label="Type" required>
                        <select className="form-control" value={form.type} onChange={e => set('type', e.target.value)}>
                            <option value="">Select type…</option>
                            <option value="user_story">User Story</option>
                            <option value="task">Task</option>
                            <option value="bug">Bug</option>
                        </select>
                    </FormField>

                    <FormField label="Sprint" required>
                        <input
                            className="form-control"
                            type="text"
                            value={sprint?.name || `Sprint ${id_sprint}`}
                            readOnly
                            style={{ backgroundColor: '#F5F4F0', color: '#9e9b92' }}
                        />
                    </FormField>

                    <FormField label="Assignee" required>
                        <select className="form-control" value={form.assignee} onChange={e => set('assignee', e.target.value)}>
                            <option value="">Select assignee…</option>
                            <option value="1">LC</option>
                            <option value="2">BK</option>
                            <option value="3">AD</option>
                            <option value="4">JR</option>
                        </select>
                    </FormField>
                </div>

                {/* Row 2: Title (full width) */}
                <FormField label="Title" required>
                    <input
                        className="form-control"
                        type="text"
                        placeholder="Describe this work item clearly…"
                        value={form.title}
                        onChange={e => set('title', e.target.value)}
                    />
                </FormField>

                {/* Row 3: SP | Gamification Weight | Target Date */}
                <div className="form-row">
                    <FormField label="Story Points (≥0)" required>
                        <input className="form-control" type="number" min={0} value={form.sp}
                            onChange={e => set('sp', e.target.value)} />
                    </FormField>

                    <FormField label="Gamification Weight (>0)" required>
                        <input className="form-control" type="number" min={1} value={form.weight}
                            onChange={e => set('weight', e.target.value)} />
                    </FormField>

                    <FormField label="Target Date" required>
                        <input className="form-control" type="date" value={form.target_date}
                            onChange={e => set('target_date', e.target.value)} />
                    </FormField>
                </div>

                {/* Description */}
                <FormField label="Description">
                    <textarea
                        className="form-control"
                        placeholder="Detailed description of the work item…"
                        value={form.description}
                        onChange={e => set('description', e.target.value)}
                    />
                </FormField>
            </div>

            <div className="add-form__footer">
                <button className="btn-cancel" onClick={onCancel} disabled={submitting}>Cancel</button>
                <button className="btn-submit" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Adding…' : 'Add to Sprint'}
                </button>
            </div>
        </div>
    );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────────
export default function SprintBoard() {
    const location    = useLocation();
    const navigate    = useNavigate();
    const { id, id_sprint } = useParams();
    const { user }    = useAuthContext();

    const isPM = user?.role === 'pm' || user?.role === 'admin';

    const [sprint,      setSprint]      = useState(location.state?.sprint || null);
    const [projectName, setProjectName] = useState(location.state?.projectName || null);
    const [columns,     setColumns]     = useState(INITIAL_COLUMNS);
    const [showForm,    setShowForm]    = useState(false);
    const [search,      setSearch]      = useState('');

    // Carga sprint si no viene en state
    useEffect(() => {
        async function load() {
            try {
                const res = await api.get(`/sprintBoard/${id_sprint}/getSprintInfo`);
                if (res.data?.data) setSprint(res.data.data);
            } catch {}
            try {
                await api.get(`/sprintBoard/${id_sprint}/getWorkItems`);
                // TODO: mapear respuesta a columnas cuando el API esté listo
            } catch {}
        }
        if (!sprint) load();
    }, [id_sprint, sprint]);

    // Carga nombre del proyecto si no viene en state
    useEffect(() => {
        if (projectName) return;
        async function fetchProject() {
            try {
                const { res, data } = await api.get(`/projects/${id}`);
                if (res?.ok && data?.project_name) setProjectName(data.project_name);
            } catch {}
        }
        fetchProject();
    }, [id, projectName]);

  const location = useLocation();
  const { id_sprint } = useParams();
  const [sprint, setSprint] = useState(location.state?.sprint);
  const [columns, setColumns] = useState(INITIAL_COLUMNS);

    const spEstimated   = sprint?.SP_estimated ?? 55;
    const spCompleted   = 8; // TODO: calculado desde work items
    const pct           = Math.min(100, Math.round((spCompleted / Math.max(spEstimated, 1)) * 100));

    if (!sprint) {
        return (
            <div className="sprint-board" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <p style={{ color: '#9e9b92', fontSize: 14 }}>Cargando sprint…</p>
            </div>
        );
    }
  }, [id_sprint, sprint])

  if (!sprint) return <p>Cargando...</p>;

  const handleAdd = (form) => {
    if (!form.type || !form.title || !form.assignee) return;
    const newCard = {
      id: `NEW-${Date.now()}`,
      type: form.type,
      title: form.title,
      assignee: form.assignee,
      sp: Number(form.sp),
      due: form.date || "TBD",
      tag: null,
    };
    setColumns(prev => ({
      ...prev,
      todo: { ...prev.todo, cards: [...prev.todo.cards, newCard] },
    }));
  };

  return (
    <div className="sprint-board">

      <nav className="breadcrumb">
        <span>Alpha Banking Portal</span>
        <span>›</span>
        <span>Backlog</span>
      </nav>

      <div className="page-header">
        <h1 className="page-header__title">Sprint backlog</h1>
        <div className="page-header__actions">
          <button className="btn-icon"><IconSearch /></button>
          <button className="btn-icon"><IconFilter /></button>
        </div>
      </div>

      <div className="sprint-meta">
        <div className="meta-item">
          <span className="meta-item__label">Sprint</span>
          <span className="meta-item__value">{sprint.name}</span>
        </div>
        <div className="meta-sep" />
        <div className="meta-item">
          <span className="meta-item__label">Dates</span>
          <span className="meta-item__value">{sprint.begin_at ? sprint.begin_at.slice(0, 10) : '—'} to {sprint.deadline ? sprint.deadline.slice(0, 10) : '—'} </span>
        </div>
        <div className="meta-sep" />
        <div className="meta-item">
          <span className="meta-item__label">Planned SP</span>
          <span className="meta-item__value">{sprint.SP_estimated}</span>
        </div>
        <div className="meta-sep" />
        <div className="meta-item">
          <span className="meta-item__label">Completed SP</span>
          <span className="meta-item__value meta-item__value--accent">8 / {sprint.SP_estimated}</span>
        </div>
        <div className="meta-progress">
          <div className="progress-bar">
            <div className="progress-bar__fill" />
          </div>
          <span className="progress-label">15%</span>
        </div>
      </div>

      <div className="board">
        {Object.values(columns).map(col => (
          <Column key={col?.id} col={col} />
        ))}
      </div>

    return (
        <div className="sprint-board">

            {/* ── Breadcrumb ─────────────────────────────────────────────── */}
            <nav className="breadcrumb">
                <span
                    className="breadcrumb__link"
                    onClick={() => navigate(`/projects/${id}/view`, { state: { projectName: projectLabel } })}
                >
                    {projectLabel}
                </span>
                <span className="breadcrumb__sep">›</span>
                <span
                    className="breadcrumb__link"
                    onClick={() => navigate(`/projects/${id}/sprints`)}
                >
                    Backlog
                </span>
            </nav>

            {/* ── Page Header ────────────────────────────────────────────── */}
            <div className="page-header">
                <h1 className="page-header__title">
                    Sprint {sprintNum} Board — {projectLabel}
                </h1>
                <div className="page-header__actions">
                    <input
                        className="header-search"
                        placeholder="Search…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <input className="header-search" placeholder="Filter…" readOnly />
                    {isPM && (
                        <button className="btn-add" onClick={() => setShowForm(v => !v)}>
                            <IconPlus />
                            Add
                        </button>
                    )}
                </div>
            </div>

            {/* ── Sprint Meta ─────────────────────────────────────────────── */}
            <div className="sprint-meta">
                <div className="meta-item">
                    <span className="meta-item__label">Sprint</span>
                    <span className="meta-item__value">{sprintLabel}</span>
                </div>
                <div className="meta-sep" />
                <div className="meta-item">
                    <span className="meta-item__label">Dates</span>
                    <span className="meta-item__value">
                        {fmtDate(sprint.begin_at)} — {fmtDate(sprint.deadline)}
                    </span>
                </div>
                <div className="meta-sep" />
                <div className="meta-item">
                    <span className="meta-item__label">Planned SP</span>
                    <span className="meta-item__value">{spEstimated} SP</span>
                </div>
                <div className="meta-sep" />
                <div className="meta-item">
                    <span className="meta-item__label">Completed SP</span>
                    <span className="meta-item__value meta-item__value--accent">
                        {spCompleted} / {spEstimated}
                    </span>
                </div>
                <div className="meta-progress">
                    <div className="progress-bar">
                        <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="progress-label">{pct}%</span>
                </div>
            </div>

            {/* ── Kanban Board ─────────────────────────────────────────────── */}
            <div className="board">
                {Object.values(columns).map(col => (
                    <Column key={col.id} col={col} />
                ))}
            </div>

            {/* ── Add Work Item Form (toggle) ───────────────────────────── */}
            {showForm && (
                <AddWorkItemForm
                    sprint={sprint}
                    onCancel={() => setShowForm(false)}
                    onAdded={() => {
                        // TODO: refrescar columnas desde API
                    }}
                />
            )}

        </div>
    );
}