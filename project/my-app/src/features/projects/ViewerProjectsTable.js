import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import './ViewerProjectsTable.css';

/* ─── Mock helpers ─────────────────────────────────────────────────── */
const MOCK_PROGRESS  = [42, 55, 68, 37, 74, 61];
const MOCK_EXPECTED  = [68, 62, 70, 50, 77, 64];
const MOCK_RISKS     = [4, 2, 1, 5, 0, 3];
const MOCK_COST      = ['$284,500', '$412,000', '$198,750', '$530,000', '$312,400', '$275,900'];

function getVisualMetrics(index) {
    const progress    = MOCK_PROGRESS[index % MOCK_PROGRESS.length];
    const expected    = MOCK_EXPECTED[index % MOCK_EXPECTED.length];
    const deviation   = progress - expected;
    const activeRisks = MOCK_RISKS[index % MOCK_RISKS.length];
    const cost        = MOCK_COST[index % MOCK_COST.length];

    let semaphore = { label: 'Verde', color: '#2E7D32', bg: '#E7F6EA' };
    if (activeRisks >= 4 || deviation <= -20)
        semaphore = { label: 'Rojo',     color: '#B71C1C', bg: '#FDECEC' };
    else if (activeRisks >= 2 || deviation <= -8)
        semaphore = { label: 'Amarillo', color: '#8A5A00', bg: '#FFF3D9' };

    return { progress, expected, deviation, activeRisks, semaphore, cost };
}

/* ─── Viewer Management Modal ───────────────────────────────────────── */
function ViewersModal({ project, onClose }) {
    const [viewers,    setViewers]    = useState([]);
    const [allViewers, setAllViewers] = useState([]);
    const [selected,   setSelected]   = useState('');
    const [loading,    setLoading]    = useState(true);
    const [adding,     setAdding]     = useState(false);

    const loadViewers = useCallback(async () => {
        try {
            const { res, data } = await api.get(`/projects/${project.id_project}/viewers`);
            if (res.ok) setViewers(data.viewers || []);
        } catch {}
    }, [project.id_project]);

    useEffect(() => {
        async function init() {
            setLoading(true);
            try {
                const [pvRes, avRes] = await Promise.all([
                    api.get(`/projects/${project.id_project}/viewers`),
                    api.get('/projects/viewers'),
                ]);
                if (pvRes.res.ok)  setViewers(pvRes.data.viewers   || []);
                if (avRes.res.ok)  setAllViewers(avRes.data.viewers || []);
            } catch {}
            setLoading(false);
        }
        init();
    }, [project.id_project]);

    const available = allViewers.filter(v => !viewers.find(pv => pv.id_user === v.id_user));

    async function handleAdd() {
        if (!selected) return;
        setAdding(true);
        try {
            const { res } = await api.post(`/projects/${project.id_project}/viewers`, {
                viewer_id: parseInt(selected),
            });
            if (res.ok) { setSelected(''); loadViewers(); }
        } catch {}
        setAdding(false);
    }

    async function handleRemove(viewerId) {
        try {
            await api.delete(`/projects/${project.id_project}/viewers/${viewerId}`);
            loadViewers();
        } catch {}
    }

    return (
        <div style={ms.overlay} onClick={onClose}>
            <div style={ms.modal} onClick={e => e.stopPropagation()}>
                <div style={ms.header}>
                    <div>
                        <div style={ms.title}>Gestionar visores</div>
                        <div style={ms.sub}>{project.project_name}</div>
                    </div>
                    <button style={ms.closeBtn} onClick={onClose}>✕</button>
                </div>

                {loading ? (
                    <div style={ms.loading}>Cargando...</div>
                ) : (
                    <>
                        <div style={ms.sectionLabel}>VISORES ASIGNADOS ({viewers.length})</div>
                        {viewers.length === 0 ? (
                            <div style={ms.empty}>Sin visores asignados aún.</div>
                        ) : (
                            viewers.map(v => (
                                <div key={v.id_user} style={ms.viewerRow}>
                                    <div>
                                        <span style={ms.viewerName}>{v.username}</span>
                                        <span style={ms.viewerEmail}> · {v.email}</span>
                                    </div>
                                    <button style={ms.removeBtn} onClick={() => handleRemove(v.id_user)}>
                                        Quitar
                                    </button>
                                </div>
                            ))
                        )}

                        <div style={ms.addSection}>
                            <div style={ms.sectionLabel}>AGREGAR VISOR</div>
                            {available.length === 0 ? (
                                <div style={ms.empty}>No hay más visores disponibles.</div>
                            ) : (
                                <div style={ms.addRow}>
                                    <select
                                        style={ms.select}
                                        value={selected}
                                        onChange={e => setSelected(e.target.value)}
                                    >
                                        <option value="">— Seleccionar visor —</option>
                                        {available.map(v => (
                                            <option key={v.id_user} value={v.id_user}>
                                                {v.username} · {v.email}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        style={ms.addBtn}
                                        onClick={handleAdd}
                                        disabled={!selected || adding}
                                    >
                                        {adding ? '...' : 'Agregar'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

const ms = {
    overlay:      { position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' },
    modal:        { backgroundColor:'#FFF', borderRadius:8, padding:28, width:520, maxWidth:'90vw', maxHeight:'80vh', overflowY:'auto', boxShadow:'0 8px 40px rgba(0,0,0,0.18)' },
    header:       { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 },
    title:        { fontSize:16, fontWeight:700, color:'#1A1A1A' },
    sub:          { fontSize:12, color:'#888', marginTop:2 },
    closeBtn:     { background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#888', padding:'0 4px' },
    sectionLabel: { fontSize:11, fontWeight:600, color:'#555', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:10 },
    loading:      { padding:20, textAlign:'center', color:'#888', fontSize:13 },
    empty:        { fontSize:13, color:'#AAA', padding:'8px 0', marginBottom:16 },
    viewerRow:    { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #F5F5F4', fontSize:13 },
    viewerName:   { fontWeight:500, color:'#1A1A1A' },
    viewerEmail:  { color:'#999' },
    removeBtn:    { height:26, padding:'0 10px', backgroundColor:'transparent', color:'#CC0000', border:'1px solid #FFCDD2', borderRadius:4, fontSize:11, cursor:'pointer' },
    addSection:   { marginTop:20 },
    addRow:       { display:'flex', gap:8 },
    select:       { flex:1, height:32, padding:'0 8px', fontSize:12, border:'1px solid #E0E0DE', borderRadius:4, backgroundColor:'#FAFAFA' },
    addBtn:       { height:32, padding:'0 16px', backgroundColor:'#1A1A1A', color:'#FFF', border:'none', borderRadius:4, fontSize:12, cursor:'pointer' },
};

/* ─── Main Component ────────────────────────────────────────────────── */
export default function ViewerProjectsTable({ user }) {
    const navigate = useNavigate();
    const isPM     = user?.role === 'pm' || user?.role === 'admin';

    const [projects,     setProjects]     = useState([]);
    const [query,        setQuery]        = useState('');
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState('');
    const [viewersModal, setViewersModal] = useState(null); // project | null

    useEffect(() => {
        async function loadProjects() {
            try {
                setLoading(true);
                setError('');
                const { res, data } = await api.get('/projects');
                if (!res.ok) {
                    setProjects([]);
                    setError(data.message || 'No se pudieron cargar los proyectos');
                    return;
                }
                setProjects(Array.isArray(data) ? data : []);
            } catch {
                setProjects([]);
                setError('Error de conexión con el servidor');
            } finally {
                setLoading(false);
            }
        }
        loadProjects();
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return projects;
        return projects.filter(p =>
            String(p.project_name || '').toLowerCase().includes(q) ||
            String(p.client_name  || '').toLowerCase().includes(q)
        );
    }, [projects, query]);

    if (loading) return <div className="vpt-empty">Cargando proyectos...</div>;
    if (error)   return <div className="vpt-error">{error}</div>;

    return (
        <>
            {viewersModal && (
                <ViewersModal project={viewersModal} onClose={() => setViewersModal(null)} />
            )}

            <div className="vpt-card-wrap">
                <div className="vpt-header-row">
                    <div className="vpt-block-title">Todos los proyectos — Vista consolidada</div>
                    <div className="vpt-actions">
                        <input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Buscar proyectos..."
                            className="vpt-search"
                        />
                        <button className="vpt-btn-ghost">Filtrar</button>
                        <button className="vpt-btn-ghost">Exportar</button>
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="vpt-empty">
                        {projects.length === 0
                            ? 'No tienes proyectos asignados por el momento.'
                            : 'No hay resultados para la búsqueda.'}
                    </div>
                ) : (
                    <div className="vpt-table-container">
                        <table className="vpt-table">
                            <thead>
                                <tr>
                                    <th className="vpt-th">PROYECTO</th>
                                    <th className="vpt-th">CLIENTE</th>
                                    <th className="vpt-th">PM</th>
                                    <th className="vpt-th">ESTADO</th>
                                    <th className="vpt-th">AVANCE REAL</th>
                                    <th className="vpt-th">ESPERADO</th>
                                    <th className="vpt-th">DESVIACIÓN</th>
                                    <th className="vpt-th">COSTO APROBADO</th>
                                    <th className="vpt-th">RIESGOS ACTIVOS</th>
                                    <th className="vpt-th">SEMÁFORO</th>
                                    <th className="vpt-th">ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((project, index) => {
                                    const visual         = getVisualMetrics(index);
                                    const deviationClass = visual.deviation < 0 ? 'vpt-deviation-negative' : 'vpt-deviation-positive';
                                    const progressColor  = visual.deviation < -10 ? '#C62828' : '#E07A00';
                                    const risksClass     = visual.activeRisks > 0 ? 'vpt-risks-active' : 'vpt-risks-none';

                                    return (
                                        <tr key={project.id_project}>
                                            <td className="vpt-td vpt-project-cell">{project.project_name}</td>
                                            <td className="vpt-td">{project.client_name || 'N/A'}</td>
                                            <td className="vpt-td">PM #{project.id_pm}</td>
                                            <td className="vpt-td">
                                                <span className="vpt-active-pill">Activo</span>
                                            </td>
                                            <td className="vpt-td">
                                                <div className="vpt-progress-wrap">
                                                    <div className="vpt-progress-track">
                                                        <div
                                                            className="vpt-progress-fill"
                                                            style={{
                                                                width: `${visual.progress}%`,
                                                                '--vpt-progress-color': progressColor,
                                                            }}
                                                        />
                                                    </div>
                                                    <span>{visual.progress}%</span>
                                                </div>
                                            </td>
                                            <td className="vpt-td">{visual.expected}%</td>
                                            <td className={`vpt-td ${deviationClass}`}>
                                                {visual.deviation > 0
                                                    ? `+${visual.deviation.toFixed(2)}%`
                                                    : `${visual.deviation.toFixed(2)}%`}
                                            </td>
                                            <td className="vpt-td">{visual.cost}</td>
                                            <td className={`vpt-td ${risksClass}`}>{visual.activeRisks}</td>
                                            <td className="vpt-td">
                                                <span
                                                    className="vpt-semaphore-pill"
                                                    style={{
                                                        '--vpt-semaphore-color': visual.semaphore.color,
                                                        '--vpt-semaphore-bg':    visual.semaphore.bg,
                                                    }}
                                                >
                                                    {visual.semaphore.label}
                                                </span>
                                            </td>
                                            <td className="vpt-td">
                                                <div style={{ display:'flex', gap:5 }}>
                                                    <button
                                                        className="vpt-btn-view"
                                                        onClick={() =>
                                                            navigate(`/projects/${project.id_project}/view`, {
                                                                state: { projectName: project.project_name },
                                                            })
                                                        }
                                                    >
                                                        Ver
                                                    </button>

                                                    {isPM && (
                                                        <>
                                                            <button
                                                                className="vpt-btn-view vpt-btn-pm"
                                                                onClick={() => setViewersModal(project)}
                                                            >
                                                                Visores
                                                            </button>
                                                            <button
                                                                className="vpt-btn-view vpt-btn-pm"
                                                                onClick={() =>
                                                                    navigate(`/projects/${project.id_project}/work-items`, {
                                                                        state: { projectName: project.project_name },
                                                                    })
                                                                }
                                                            >
                                                                Items
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="vpt-footer-row">
                    Mostrando {filtered.length} de {projects.length} proyectos
                </div>
            </div>
        </>
    );
}