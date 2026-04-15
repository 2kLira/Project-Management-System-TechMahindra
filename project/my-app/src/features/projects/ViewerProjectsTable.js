import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';

const MOCK_PROGRESS = [42, 55, 68, 37, 74, 61];
const MOCK_EXPECTED = [68, 62, 70, 50, 77, 64];
const MOCK_RISKS = [4, 2, 1, 5, 0, 3];

function getVisualMetrics(index) {
    const progress = MOCK_PROGRESS[index % MOCK_PROGRESS.length];
    const expected = MOCK_EXPECTED[index % MOCK_EXPECTED.length];
    const deviation = progress - expected;
    const activeRisks = MOCK_RISKS[index % MOCK_RISKS.length];

    let semaphore = { label: 'Verde', color: '#2E7D32', bg: '#E7F6EA' };
    if (activeRisks >= 4 || deviation <= -20) {
        semaphore = { label: 'Rojo', color: '#B71C1C', bg: '#FDECEC' };
    } else if (activeRisks >= 2 || deviation <= -8) {
        semaphore = { label: 'Amarillo', color: '#8A5A00', bg: '#FFF3D9' };
    }

    return {
        progress,
        expected,
        deviation,
        activeRisks,
        semaphore,
    };
}

export default function ViewerProjectsTable() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
                setError('Error de conexion con el servidor');
            } finally {
                setLoading(false);
            }
        }

        loadProjects();
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return projects;

        return projects.filter((p) => {
            const projectName = String(p.project_name || '').toLowerCase();
            const clientName = String(p.client_name || '').toLowerCase();
            return projectName.includes(q) || clientName.includes(q);
        });
    }, [projects, query]);

    if (loading) {
        return <div style={s.empty}>Cargando proyectos...</div>;
    }

    if (error) {
        return <div style={s.error}>{error}</div>;
    }

    return (
        <div style={s.cardWrap}>
            <div style={s.headerRow}>
                <div>
                    <div style={s.blockTitle}>Todos los proyectos - Vista consolidada</div>
                </div>
                <div style={s.actions}>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar proyectos..."
                        style={s.search}
                    />
                    <button style={s.btnGhost}>Filtrar</button>
                    <button style={s.btnGhost}>Exportar</button>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div style={s.empty}>
                    {projects.length === 0
                        ? 'No tienes proyectos asignados por el momento.'
                        : 'No hay resultados para la busqueda.'}
                </div>
            ) : (
                <div style={s.tableContainer}>
                    <table style={s.table}>
                        <thead>
                            <tr>
                                <th style={s.th}>PROYECTO</th>
                                <th style={s.th}>CLIENTE</th>
                                <th style={s.th}>PM</th>
                                <th style={s.th}>ESTADO</th>
                                <th style={s.th}>AVANCE REAL</th>
                                <th style={s.th}>ESPERADO</th>
                                <th style={s.th}>DESVIACION</th>
                                <th style={s.th}>COSTO APROBADO</th>
                                <th style={s.th}>RIESGOS ACTIVOS</th>
                                <th style={s.th}>SEMAFORO</th>
                                <th style={s.th}>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((project, index) => {
                                const visual = getVisualMetrics(index);
                                const deviationColor = visual.deviation < 0 ? '#C62828' : '#2E7D32';
                                const barColor = visual.deviation < -10 ? '#C62828' : '#E07A00';

                                return (
                                    <tr key={project.id_project}>
                                        <td style={{ ...s.td, ...s.projectCell }}>{project.project_name}</td>
                                        <td style={s.td}>{project.client_name || 'N/A'}</td>
                                        <td style={s.td}>PM #{project.id_pm}</td>
                                        <td style={s.td}><span style={s.activePill}>Activo</span></td>
                                        <td style={s.td}>
                                            <div style={s.progressWrap}>
                                                <div style={s.progressTrack}>
                                                    <div style={{ ...s.progressFill, width: `${visual.progress}%`, backgroundColor: barColor }} />
                                                </div>
                                                <span>{visual.progress}%</span>
                                            </div>
                                        </td>
                                        <td style={s.td}>{visual.expected}%</td>
                                        <td style={{ ...s.td, color: deviationColor, fontWeight: 600 }}>
                                            {visual.deviation > 0 ? `+${visual.deviation.toFixed(2)}%` : `${visual.deviation.toFixed(2)}%`}
                                        </td>
                                        <td style={s.td}>Visual</td>
                                        <td style={{ ...s.td, color: visual.activeRisks > 0 ? '#E07A00' : '#777', fontWeight: 600 }}>
                                            {visual.activeRisks}
                                        </td>
                                        <td style={s.td}>
                                            <span style={{ ...s.semaphorePill, color: visual.semaphore.color, backgroundColor: visual.semaphore.bg }}>
                                                {visual.semaphore.label}
                                            </span>
                                        </td>
                                        <td style={s.td}>
                                            <button
                                                style={s.btnView}
                                                onClick={() => navigate(`/projects/${project.id_project}/view`, {
                                                    state: { projectName: project.project_name }
                                                })}
                                            >
                                                Ver
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <div style={s.footerRow}>Mostrando {filtered.length} de {projects.length} proyectos</div>
        </div>
    );
}

const s = {
    cardWrap: { width: '100%', backgroundColor: '#FFF', border: '1px solid #E7E4DD', borderRadius: 6, overflow: 'hidden' },
    headerRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        borderBottom: '1px solid #ECE8DE',
        gap: 10,
        flexWrap: 'wrap',
    },
    blockTitle: { fontSize: 14, fontWeight: 600, color: '#2C2C2C' },
    actions: { display: 'flex', gap: 8, alignItems: 'center' },
    search: {
        height: 28,
        width: 180,
        border: '1px solid #DEDAD0',
        borderRadius: 4,
        padding: '0 8px',
        backgroundColor: '#FAFAF8',
        fontSize: 12,
    },
    btnGhost: {
        height: 28,
        border: '1px solid #DEDAD0',
        backgroundColor: '#FFF',
        borderRadius: 4,
        padding: '0 10px',
        fontSize: 12,
        color: '#444',
        cursor: 'pointer',
    },
    tableContainer: { width: '100%', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: 1080 },
    th: {
        textAlign: 'left',
        fontSize: 10,
        color: '#8A8A8A',
        letterSpacing: '0.06em',
        fontWeight: 700,
        padding: '10px 10px',
        borderBottom: '1px solid #ECE8DE',
        backgroundColor: '#F7F6F2',
        whiteSpace: 'nowrap',
    },
    td: {
        fontSize: 12,
        color: '#333',
        padding: '10px 10px',
        borderBottom: '1px solid #F1EEE8',
        whiteSpace: 'nowrap',
    },
    projectCell: { color: '#CF2030', fontWeight: 600 },
    activePill: {
        display: 'inline-block',
        borderRadius: 999,
        padding: '2px 8px',
        fontSize: 10,
        fontWeight: 600,
        color: '#2453C9',
        backgroundColor: '#E7EEFF',
    },
    progressWrap: { display: 'flex', alignItems: 'center', gap: 8 },
    progressTrack: { width: 52, height: 4, borderRadius: 999, backgroundColor: '#E9E4DA', overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 999 },
    semaphorePill: {
        display: 'inline-block',
        borderRadius: 999,
        padding: '2px 10px',
        fontSize: 10,
        fontWeight: 700,
    },
    btnView: {
        height: 24,
        border: '1px solid #DEDAD0',
        backgroundColor: '#FFF',
        borderRadius: 6,
        padding: '0 10px',
        fontSize: 11,
        cursor: 'pointer',
    },
    footerRow: {
        padding: '9px 12px',
        fontSize: 11,
        color: '#8A8A8A',
        borderTop: '1px solid #ECE8DE',
        backgroundColor: '#FAFAF8',
    },
    empty: {
        padding: '24px 14px',
        textAlign: 'center',
        color: '#8A8A8A',
        fontSize: 13,
        backgroundColor: '#FFF',
    },
    error: {
        padding: '10px 12px',
        border: '1px solid #FFCDD2',
        borderRadius: 4,
        backgroundColor: '#FFF5F5',
        color: '#B71C1C',
        fontSize: 13,
    },
};