import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../shared/context/AuthContext';
import WorkItems from './WorkItems';

/**
 * Página de gestión de work items — ruta: /projects/:id/work-items
 * Solo accesible para PM / admin (protegida en AppRouter).
 */
export default function WorkItemsPage() {
    const { id }      = useParams();
    const location    = useLocation();
    const navigate    = useNavigate();
    const { user }    = useAuthContext();

    const projectName = location.state?.projectName || `Proyecto ${id}`;

    return (
        <div style={s.page}>
            {/* Top bar con breadcrumb */}
            <div style={s.topBar}>
                <div style={s.breadcrumb}>
                    <button style={s.crumbBtn} onClick={() => navigate('/projects')}>
                        Proyectos
                    </button>
                    <span style={s.sep}>/</span>
                    <button
                        style={s.crumbBtn}
                        onClick={() =>
                            navigate(`/projects/${id}/view`, { state: { projectName } })
                        }
                    >
                        {projectName}
                    </button>
                    <span style={s.sep}>/</span>
                    <span style={s.crumbCurrent}>Work Items</span>
                </div>

                <button style={s.backBtn} onClick={() => navigate('/projects')}>
                    ← Volver a proyectos
                </button>
            </div>

            {/* Contenido */}
            <div style={s.body}>
                <WorkItems
                    projectId={id}
                    projectName={projectName}
                    currentUser={user}
                />
            </div>
        </div>
    );
}

const s = {
    page:         { minHeight: '100vh', backgroundColor: '#F5F5F4', fontFamily: "'DM Sans','Helvetica Neue',sans-serif", color: '#1A1A1A' },
    topBar:       { backgroundColor: '#FFF', borderBottom: '1px solid #E5E5E3', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    breadcrumb:   { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 },
    crumbBtn:     { background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#888', padding: 0 },
    crumbBtn_hover: { color: '#CC0000' },
    sep:          { color: '#CCC' },
    crumbCurrent: { color: '#1A1A1A', fontWeight: 500 },
    backBtn:      { height: 32, padding: '0 14px', backgroundColor: 'transparent', color: '#555', border: '1px solid #D0D0CE', borderRadius: 4, fontSize: 12, cursor: 'pointer' },
    body:         { padding: 32, maxWidth: 1100 },
};