import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import './ViewerProjectsTable.css';

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
        return <div className="vpt-empty">Cargando proyectos...</div>;
    }

    if (error) {
        return <div className="vpt-error">{error}</div>;
    }

    return (
        <div className="vpt-card-wrap">
            <div className="vpt-header-row">
                <div>
                    <div className="vpt-block-title">Todos los proyectos - Vista consolidada</div>
                </div>
                <div className="vpt-actions">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
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
                        : 'No hay resultados para la busqueda.'}
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
                                <th className="vpt-th">DESVIACION</th>
                                <th className="vpt-th">COSTO APROBADO</th>
                                <th className="vpt-th">RIESGOS ACTIVOS</th>
                                <th className="vpt-th">SEMAFORO</th>
                                <th className="vpt-th">ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((project, index) => {
                                const visual = getVisualMetrics(index);
                                const deviationClass = visual.deviation < 0 ? 'vpt-deviation-negative' : 'vpt-deviation-positive';
                                const progressColor = visual.deviation < -10 ? '#C62828' : '#E07A00';
                                const risksClass = visual.activeRisks > 0 ? 'vpt-risks-active' : 'vpt-risks-none';

                                return (
                                    <tr key={project.id_project}>
                                        <td className="vpt-td vpt-project-cell">{project.project_name}</td>
                                        <td className="vpt-td">{project.client_name || 'N/A'}</td>
                                        <td className="vpt-td">PM #{project.id_pm}</td>
                                        <td className="vpt-td"><span className="vpt-active-pill">Activo</span></td>
                                        <td className="vpt-td">
                                            <div className="vpt-progress-wrap">
                                                <div className="vpt-progress-track">
                                                    <div
                                                        className="vpt-progress-fill"
                                                        style={{ width: `${visual.progress}%`, '--vpt-progress-color': progressColor }}
                                                    />
                                                </div>
                                                <span>{visual.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="vpt-td">{visual.expected}%</td>
                                        <td className={`vpt-td ${deviationClass}`}>
                                            {visual.deviation > 0 ? `+${visual.deviation.toFixed(2)}%` : `${visual.deviation.toFixed(2)}%`}
                                        </td>
                                        <td className="vpt-td">Visual</td>
                                        <td className={`vpt-td ${risksClass}`}>
                                            {visual.activeRisks}
                                        </td>
                                        <td className="vpt-td">
                                            <span
                                                className="vpt-semaphore-pill"
                                                style={{ '--vpt-semaphore-color': visual.semaphore.color, '--vpt-semaphore-bg': visual.semaphore.bg }}
                                            >
                                                {visual.semaphore.label}
                                            </span>
                                        </td>
                                        <td className="vpt-td">
                                            <button
                                                className="vpt-btn-view"
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

            <div className="vpt-footer-row">Mostrando {filtered.length} de {projects.length} proyectos</div>
        </div>
    );
}