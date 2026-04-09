import { useState, useEffect } from 'react';

// -----------------------------------
// ESTILOS (sin sidebar, ahora es externo)
// -----------------------------------

const styles = {
    page: {
        minHeight: '100vh',
        backgroundColor: '#F5F5F4',
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
        color: '#1A1A1A',
    },

    topBar: {
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E5E3',
        padding: '0 32px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    breadcrumb: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        color: '#888',
    },

    breadcrumbSep: { color: '#CCC' },
    breadcrumbActive: { color: '#1A1A1A', fontWeight: '500' },

    topActions: {
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
    },

    // area principal
    main: {
        padding: '32px',
        maxWidth: '1200px',
    },

    pageTitle: {
        fontSize: '22px',
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: '4px',
    },

    pageSubtitle: {
        fontSize: '13px',
        color: '#888',
        marginBottom: '32px',
    },

    twoCol: {
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: '24px',
        alignItems: 'start',
    },

    card: {
        backgroundColor: '#FFFFFF',
        border: '1px solid #E8E8E6',
        borderRadius: '6px',
        marginBottom: '16px',
        overflow: 'hidden',
    },

    cardHeader: {
        padding: '16px 20px',
        borderBottom: '1px solid #F0F0EE',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    cardTitle: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#1A1A1A',
    },

    cardNote: {
        fontSize: '11px',
        color: '#AAA',
    },

    cardBody: {
        padding: '20px',
    },

    row: {
        display: 'grid',
        gap: '16px',
        marginBottom: '16px',
    },

    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
    },

    label: {
        fontSize: '12px',
        fontWeight: '500',
        color: '#555',
    },

    required: {
        color: '#CC0000',
        marginLeft: '2px',
    },

    input: (error) => ({
        height: '36px',
        padding: '0 10px',
        fontSize: '13px',
        color: '#1A1A1A',
        backgroundColor: '#FAFAFA',
        border: `1px solid ${error ? '#CC0000' : '#E0E0DE'}`,
        borderRadius: '4px',
        outline: 'none',
        transition: 'border-color 0.15s',
        fontFamily: 'inherit',
    }),

    select: (error) => ({
        height: '36px',
        padding: '0 10px',
        fontSize: '13px',
        color: '#1A1A1A',
        backgroundColor: '#FAFAFA',
        border: `1px solid ${error ? '#CC0000' : '#E0E0DE'}`,
        borderRadius: '4px',
        outline: 'none',
        fontFamily: 'inherit',
        cursor: 'pointer',
    }),

    fieldError: {
        fontSize: '11px',
        color: '#CC0000',
    },

    hint: {
        fontSize: '11px',
        color: '#AAA',
        marginTop: '2px',
    },

    tagContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        marginTop: '8px',
        minHeight: '24px',
    },

    tag: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 8px',
        backgroundColor: '#F0F0EE',
        border: '1px solid #E0E0DE',
        borderRadius: '3px',
        fontSize: '12px',
        color: '#444',
    },

    tagRemove: {
        cursor: 'pointer',
        color: '#999',
        fontSize: '14px',
        lineHeight: '1',
    },

    summary: {
        backgroundColor: '#FFFFFF',
        border: '1px solid #E8E8E6',
        borderRadius: '6px',
        overflow: 'hidden',
        position: 'sticky',
        top: '24px',
    },

    summaryHeader: {
        padding: '14px 18px',
        borderBottom: '1px solid #F0F0EE',
        fontSize: '12px',
        fontWeight: '600',
        color: '#888',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
    },

    summaryBody: {
        padding: '16px 18px',
    },

    summaryRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '8px 0',
        borderBottom: '1px solid #F5F5F4',
        fontSize: '12px',
    },

    summaryKey: {
        color: '#888',
        flexShrink: 0,
        marginRight: '12px',
    },

    summaryVal: {
        color: '#1A1A1A',
        fontWeight: '500',
        textAlign: 'right',
        wordBreak: 'break-word',
    },

    validationBox: {
        padding: '14px 18px',
        borderTop: '1px solid #F0F0EE',
    },

    validItem: (ok) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '11px',
        color: ok ? '#2E7D32' : '#AAA',
        padding: '3px 0',
    }),

    validDot: (ok) => ({
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: ok ? '#4CAF50' : '#DDD',
        flexShrink: 0,
    }),

    btnPrimary: {
        height: '38px',
        padding: '0 20px',
        backgroundColor: '#CC0000',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '4px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
    },

    btnSecondary: {
        height: '38px',
        padding: '0 18px',
        backgroundColor: 'transparent',
        color: '#555',
        border: '1px solid #D0D0CE',
        borderRadius: '4px',
        fontSize: '13px',
        cursor: 'pointer',
    },

    msgSuccess: {
        backgroundColor: '#F0FAF1',
        border: '1px solid #C8E6C9',
        borderRadius: '4px',
        padding: '12px 16px',
        fontSize: '13px',
        color: '#2E7D32',
        marginBottom: '16px',
    },

    msgError: {
        backgroundColor: '#FFF5F5',
        border: '1px solid #FFCDD2',
        borderRadius: '4px',
        padding: '12px 16px',
        fontSize: '13px',
        color: '#B71C1C',
        marginBottom: '16px',
    },

    spinner: {
        display: 'inline-block',
        width: '12px',
        height: '12px',
        border: '2px solid rgba(255,255,255,0.4)',
        borderTop: '2px solid #FFF',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        marginRight: '8px',
        verticalAlign: 'middle',
    },
};

// -----------------------------------
// COMPONENTE PRINCIPAL
// -----------------------------------

function CreateProject({ onCancel }) {

    const [form, setForm] = useState({
        name: '',
        client: '',
        status: 'planning',
        start_date: '',
        deadline: '',
        budget: '',
        monthly_cost: '',
        story_points: '',
        pm_id: '',
    });

    const [errors, setErrors] = useState({});
    const [pms, setPms] = useState([]);
    const [viewers, setViewers] = useState([]);
    const [selectedViewers, setSelectedViewers] = useState([]);
    const [mensaje, setMensaje] = useState({ type: '', text: '' });
    const [pmLoadError, setPmLoadError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadPMs();
        loadViewers();
    }, []);

    async function loadPMs() {
        try {
            setPmLoadError('');
            const res = await fetch('http://localhost:8080/projects/managers', {
                credentials: 'include'
            });
            const data = await res.json();
            if (res.ok) {
                setPms(data.pms || []);
            } else {
                setPms([]);
                setPmLoadError(data.message || data.error || `Error ${res.status} cargando PMs`);
            }
        } catch (err) {
            console.error('Error cargando PMs:', err);
            setPms([]);
            setPmLoadError('Error de conexión cargando PMs');
        }
    }

    async function loadViewers() {
        try {
            const res = await fetch('http://localhost:8080/projects/viewers', {
                credentials: 'include'
            });
            const data = await res.json();
            if (res.ok) setViewers(data.viewers || []);
        } catch (err) {
            console.error('Error cargando viewers:', err);
        }
    }

    function handleChange(e) {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    }

    function addViewer(e) {
        const id = e.target.value;
        if (!id) return;
        const viewer = viewers.find(v => String(v.id_user) === String(id));
        if (viewer && !selectedViewers.find(v => String(v.id_user) === String(id))) {
            setSelectedViewers(prev => [...prev, viewer]);
        }
        e.target.value = '';
    }

    function removeViewer(id) {
        setSelectedViewers(prev => prev.filter(v => String(v.id_user) !== String(id)));
    }

    function validate() {
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = 'El nombre es obligatorio';
        if (!form.client.trim()) newErrors.client = 'El cliente es obligatorio';
        if (!form.start_date) newErrors.start_date = 'La fecha de inicio es obligatoria';
        if (!form.deadline) newErrors.deadline = 'El deadline es obligatorio';
        if (form.start_date && form.deadline && form.deadline <= form.start_date) {
            newErrors.deadline = 'El deadline debe ser después del inicio';
        }
        if (!form.pm_id) newErrors.pm_id = 'Se requiere asignar un PM (CA-03)';
        if (!form.budget.trim()) {
            newErrors.budget = 'El presupuesto es obligatorio';
        } else if (isNaN(form.budget)) {
            newErrors.budget = 'Debe ser un número';
        }
        if (form.monthly_cost && isNaN(form.monthly_cost)) newErrors.monthly_cost = 'Debe ser un número';
        if (!form.story_points.trim()) {
            newErrors.story_points = 'Los story points son obligatorios';
        } else if (isNaN(form.story_points)) {
            newErrors.story_points = 'Debe ser un número';
        } else if (parseInt(form.story_points, 10) <= 0) {
            newErrors.story_points = 'Debe ser mayor a 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function handleSubmit() {
        setMensaje({ type: '', text: '' });
        if (!validate()) return;

        setLoading(true);
        try {
            const payload = {
                project_name: form.name,
                client_name: form.client,
                status: form.status,
                start_date: form.start_date,
                deadline: form.deadline,
                estimated_budget: form.budget ? parseFloat(form.budget) : null,
                monthly_cost: form.monthly_cost ? parseFloat(form.monthly_cost) : null,
                estimated_sp: form.story_points ? parseInt(form.story_points) : null,
                id_pm: form.pm_id,
                viewer_ids: selectedViewers.map(v => v.id_user),
            };

            const res = await fetch('http://localhost:8080/projects/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok) {
                setMensaje({ type: 'success', text: `Proyecto "${form.name}" creado exitosamente.` });
                setForm({ name: '', client: '', status: 'planning', start_date: '', deadline: '', budget: '', monthly_cost: '', story_points: '', pm_id: '' });
                setSelectedViewers([]);
                if (typeof onCancel === 'function') onCancel();
            } else {
                setMensaje({ type: 'error', text: data.message || data.error || 'Error al crear el proyecto.' });
            }
        } catch (err) {
            console.error(err);
            setMensaje({ type: 'error', text: 'Error de conexión con el servidor.' });
        } finally {
            setLoading(false);
        }
    }

    const selectedPM = pms.find(p => String(p.id_user) === String(form.pm_id));

    const duration = (() => {
        if (!form.start_date || !form.deadline) return '-';
        const diff = new Date(form.deadline) - new Date(form.start_date);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days < 0) return 'Fecha inválida';
        const months = Math.floor(days / 30);
        const rem = days % 30;
        return months > 0 ? `${months}m ${rem}d` : `${rem}d`;
    })();

    const caChecks = [
        { label: 'CA-01 · Nombre obligatorio', ok: !!form.name.trim() },
        {
            label: 'CA-02 · Cliente, fechas, presupuesto y SP obligatorios',
            ok: !!form.client.trim() && !!form.start_date && !!form.deadline && !!form.budget.trim() && !!form.story_points.trim(),
        },
        {
            label: 'CA-03 · Deadline posterior a start',
            ok: !!form.start_date && !!form.deadline && form.deadline > form.start_date,
        },
        {
            label: 'CA-04 · Story points > 0',
            ok: !!form.story_points.trim() && !isNaN(form.story_points) && parseInt(form.story_points, 10) > 0,
        },
        {
            label: 'CA-05 · No guardar si falta obligatorio',
            ok: !!form.name.trim() && !!form.client.trim() && !!form.start_date && !!form.deadline && !!form.budget.trim() && !!form.story_points.trim(),
        },
    ];

    const viewers_available = viewers.filter(v => !selectedViewers.find(s => String(s.id_user) === String(v.id_user)));

    return (
        <div style={styles.page}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
                input:focus { border-color: #CC0000 !important; background: #FFFFFF !important; }
                select:focus { border-color: #CC0000 !important; background: #FFFFFF !important; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            {/* top bar */}
            <div style={styles.topBar}>
                <div style={styles.breadcrumb}>
                    <span>Dashboard</span>
                    <span style={styles.breadcrumbSep}>/</span>
                    <span>Projects</span>
                    <span style={styles.breadcrumbSep}>/</span>
                    <span style={styles.breadcrumbActive}>New Project</span>
                </div>
                <div style={styles.topActions}>
                    <button style={styles.btnSecondary} onClick={onCancel}>Discard</button>
                    <button
                        style={styles.btnPrimary}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading && <span style={styles.spinner} />}
                        Save Project
                    </button>
                </div>
            </div>

            {/* contenido principal (sin sidebar interno) */}
            <div style={styles.main}>

                <div style={styles.pageTitle}>Create New Project</div>
                <div style={styles.pageSubtitle}>Complete all required fields before saving.</div>

                {mensaje.text && (
                    <div style={mensaje.type === 'success' ? styles.msgSuccess : styles.msgError}>
                        {mensaje.text}
                    </div>
                )}

                <div style={styles.twoCol}>

                    {/* columna izquierda - formulario */}
                    <div>

                        {/* Project Information */}
                        <div style={styles.card}>
                            <div style={styles.cardHeader}>
                                <span style={styles.cardTitle}>Project Information</span>
                                <span style={styles.cardNote}>RF-04 · Name must be unique</span>
                            </div>
                            <div style={styles.cardBody}>
                                <div style={{ ...styles.row, gridTemplateColumns: '1fr 1fr' }}>
                                    <div style={styles.fieldGroup}>
                                        <label style={styles.label}>
                                            Project Name <span style={styles.required}>*</span>
                                        </label>
                                        <input
                                            style={styles.input(errors.name)}
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            placeholder="Alpha Banking Portal"
                                        />
                                        {errors.name && <span style={styles.fieldError}>{errors.name}</span>}
                                    </div>
                                    <div style={styles.fieldGroup}>
                                        <label style={styles.label}>
                                            Project Status <span style={styles.required}>*</span>
                                        </label>
                                        <select
                                            style={styles.select(false)}
                                            name="status"
                                            value={form.status}
                                            onChange={handleChange}
                                        >
                                            <option value="planning">Planning</option>
                                            <option value="active">Active</option>
                                            <option value="on_hold">On Hold</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={styles.fieldGroup}>
                                    <label style={styles.label}>
                                        Client <span style={styles.required}>*</span>
                                    </label>
                                    <input
                                        style={styles.input(errors.client)}
                                        name="client"
                                        value={form.client}
                                        onChange={handleChange}
                                        placeholder="HDFC Bank"
                                    />
                                    {errors.client && <span style={styles.fieldError}>{errors.client}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div style={styles.card}>
                            <div style={styles.cardHeader}>
                                <span style={styles.cardTitle}>Timeline</span>
                                <span style={styles.cardNote}>Deadline must be after start date</span>
                            </div>
                            <div style={styles.cardBody}>
                                <div style={{ ...styles.row, gridTemplateColumns: '1fr 1fr' }}>
                                    <div style={styles.fieldGroup}>
                                        <label style={styles.label}>
                                            Start Date <span style={styles.required}>*</span>
                                        </label>
                                        <input
                                            type="date"
                                            style={styles.input(errors.start_date)}
                                            name="start_date"
                                            value={form.start_date}
                                            onChange={handleChange}
                                        />
                                        {errors.start_date && <span style={styles.fieldError}>{errors.start_date}</span>}
                                    </div>
                                    <div style={styles.fieldGroup}>
                                        <label style={styles.label}>
                                            Deadline <span style={styles.required}>*</span>
                                        </label>
                                        <input
                                            type="date"
                                            style={styles.input(errors.deadline)}
                                            name="deadline"
                                            value={form.deadline}
                                            onChange={handleChange}
                                        />
                                        {errors.deadline && <span style={styles.fieldError}>{errors.deadline}</span>}
                                    </div>
                                </div>
                                {duration !== '-' && (
                                    <div style={styles.hint}>Duration: {duration}</div>
                                )}
                            </div>
                        </div>

                        {/* Budget & Story Points */}
                        <div style={styles.card}>
                            <div style={styles.cardHeader}>
                                <span style={styles.cardTitle}>Budget & Story Points</span>
                                <span style={styles.cardNote}>RF-04 · Financial data (Admin & PM only)</span>
                            </div>
                            <div style={styles.cardBody}>
                                <div style={{ ...styles.row, gridTemplateColumns: '1fr 1fr 1fr' }}>
                                    <div style={styles.fieldGroup}>
                                        <label style={styles.label}>
                                            Estimated Budget (USD) <span style={styles.required}>*</span>
                                        </label>
                                        <input
                                            style={styles.input(errors.budget)}
                                            name="budget"
                                            value={form.budget}
                                            onChange={handleChange}
                                            placeholder="500000"
                                        />
                                        {errors.budget && <span style={styles.fieldError}>{errors.budget}</span>}
                                    </div>
                                    <div style={styles.fieldGroup}>
                                        <label style={styles.label}>Monthly Cost Estimate</label>
                                        <input
                                            style={styles.input(errors.monthly_cost)}
                                            name="monthly_cost"
                                            value={form.monthly_cost}
                                            onChange={handleChange}
                                            placeholder="85000"
                                        />
                                        {errors.monthly_cost && <span style={styles.fieldError}>{errors.monthly_cost}</span>}
                                    </div>
                                    <div style={styles.fieldGroup}>
                                        <label style={styles.label}>
                                            Total Planned Story Points <span style={styles.required}>*</span>
                                        </label>
                                        <input
                                            style={styles.input(errors.story_points)}
                                            name="story_points"
                                            value={form.story_points}
                                            onChange={handleChange}
                                            placeholder="240"
                                        />
                                        {errors.story_points && <span style={styles.fieldError}>{errors.story_points}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Team Assignment */}
                        <div style={styles.card}>
                            <div style={styles.cardHeader}>
                                <span style={styles.cardTitle}>Team Assignment</span>
                                <span style={styles.cardNote}>RF-05 · Exactly one PM required</span>
                            </div>
                            <div style={styles.cardBody}>
                                <div style={{ ...styles.fieldGroup, marginBottom: '16px' }}>
                                    <label style={styles.label}>
                                        Project Manager <span style={styles.required}>* (required)</span>
                                    </label>
                                    <select
                                        style={styles.select(errors.pm_id)}
                                        name="pm_id"
                                        value={form.pm_id}
                                        onChange={handleChange}
                                    >
                                        <option value="">— Select a Project Manager —</option>
                                        {pms.map(pm => (
                                            <option key={pm.id_user} value={pm.id_user}>
                                                {pm.username} · {pm.email}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.pm_id && <span style={styles.fieldError}>{errors.pm_id}</span>}
                                    {pmLoadError && <span style={styles.fieldError}>{pmLoadError}</span>}
                                    {pms.length === 0 && (
                                        <span style={styles.hint}>No hay usuarios con rol PM disponibles.</span>
                                    )}
                                </div>

                                <div style={styles.fieldGroup}>
                                    <label style={styles.label}>Add Viewers (optional)</label>
                                    <select
                                        style={styles.select(false)}
                                        onChange={addViewer}
                                        defaultValue=""
                                    >
                                        <option value="">— Add a viewer —</option>
                                        {viewers_available.map(v => (
                                            <option key={v.id_user} value={v.id_user}>
                                                {v.username} · {v.email}
                                            </option>
                                        ))}
                                    </select>

                                    {selectedViewers.length > 0 && (
                                        <div style={styles.tagContainer}>
                                            {selectedViewers.map(v => (
                                                <div key={v.id_user} style={styles.tag}>
                                                    {v.username}
                                                    <span
                                                        style={styles.tagRemove}
                                                        onClick={() => removeViewer(v.id_user)}
                                                    >×</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <span style={styles.hint}>
                                        {selectedViewers.length} assigned
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* columna derecha - resumen */}
                    <div>
                        <div style={styles.summary}>
                            <div style={styles.summaryHeader}>Project Summary</div>
                            <div style={styles.summaryBody}>
                                {[
                                    { key: 'Name', val: form.name || '—' },
                                    { key: 'Client', val: form.client || '—' },
                                    { key: 'Timeline', val: form.start_date && form.deadline ? `${form.start_date} → ${form.deadline}` : '—' },
                                    { key: 'Budget', val: form.budget ? `$${parseInt(form.budget).toLocaleString()}` : '—' },
                                    { key: 'Monthly Cost', val: form.monthly_cost ? `$${parseInt(form.monthly_cost).toLocaleString()}` : '—' },
                                    { key: 'Story Points', val: form.story_points ? `${form.story_points} SP` : '—' },
                                    { key: 'PM Assigned', val: selectedPM ? `✓ ${selectedPM.username}` : '—' },
                                    { key: 'Viewers', val: selectedViewers.length > 0 ? `${selectedViewers.length} assigned` : '—' },
                                ].map(({ key, val }) => (
                                    <div key={key} style={styles.summaryRow}>
                                        <span style={styles.summaryKey}>{key}</span>
                                        <span style={{
                                            ...styles.summaryVal,
                                            color: key === 'PM Assigned' && selectedPM ? '#2E7D32' : '#1A1A1A'
                                        }}>{val}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={styles.validationBox}>
                                <div style={{ fontSize: '10px', fontWeight: '600', color: '#AAA', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
                                    Validation Rules
                                </div>
                                {caChecks.map(({ label, ok }) => (
                                    <div key={label} style={styles.validItem(ok)}>
                                        <div style={styles.validDot(ok)} />
                                        {label}
                                    </div>
                                ))}
                            </div>

                            <div style={{ padding: '16px 18px', borderTop: '1px solid #F0F0EE' }}>
                                <button
                                    style={{ ...styles.btnPrimary, width: '100%' }}
                                    onClick={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading && <span style={styles.spinner} />}
                                    Save Project
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default CreateProject;