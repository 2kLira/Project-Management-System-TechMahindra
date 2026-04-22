import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getBacklogItemsForProject } from './viewerBacklogMock';

export default function ViewerProjectWorkspacePage() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const projectName = location.state?.projectName || `Proyecto ${id}`;
    const backlogItems = getBacklogItemsForProject(id);
    const blockedItems = backlogItems.filter((item) => item.blockerCount > 0).length;
    const doneItems = backlogItems.filter((item) => item.status === 'Done').length;
    const progress = Math.round((doneItems / Math.max(backlogItems.length, 1)) * 100);

    return (
        <div style={s.page}>
            <div style={s.topBar}>
                <div style={s.breadcrumb}>
                    <span>Inicio</span>
                    <span style={{ color:'#CCC' }}>/</span>
                    <span>Projects</span>
                    <span style={{ color:'#CCC' }}>/</span>
                    <span style={{ color:'#1A1A1A', fontWeight:500 }}>{projectName}</span>
                </div>
                <button style={s.backlogBtn} onClick={() => navigate(`/projects/${id}/backlog`, { state: { projectName } })}>
                    Ir al backlog
                </button>
            </div>

            <div style={s.body}>
                <section style={s.heroCard}>
                    <div>
                        <div style={s.kicker}>Viewer project workspace</div>
                        <h1 style={s.title}>{projectName}</h1>
                        <p style={s.subtitle}>
                            Vista visual del proyecto para revisar avance, backlog y bloqueadores sin tocar backend todavía.
                        </p>
                    </div>

                    <div style={s.heroActions}>
                        <button style={s.primaryBtn} onClick={() => navigate(`/projects/${id}/backlog`, { state: { projectName } })}>
                            Ver backlog
                        </button>
                        <div style={s.heroTag}>Sprint 4 active</div>
                    </div>
                </section>

                <section style={s.statsGrid}>
                    <div style={s.statCard}>
                        <span style={s.statLabel}>Backlog items</span>
                        <strong style={s.statValue}>{backlogItems.length}</strong>
                        <span style={s.statHint}>Items visibles para el viewer</span>
                    </div>
                    <div style={s.statCard}>
                        <span style={s.statLabel}>Blocked items</span>
                        <strong style={s.statValueDanger}>{blockedItems}</strong>
                        <span style={s.statHint}>Bloqueadores o implicaciones activas</span>
                    </div>
                    <div style={s.statCard}>
                        <span style={s.statLabel}>Visual progress</span>
                        <strong style={s.statValue}>{progress}%</strong>
                        <span style={s.progressTrack}>
                            <span style={{ ...s.progressFill, width: `${progress}%` }} />
                        </span>
                    </div>
                    <div style={s.statCard}>
                        <span style={s.statLabel}>Current status</span>
                        <strong style={s.statValue}>In review</strong>
                        <span style={s.statHint}>Solo representación visual por ahora</span>
                    </div>
                </section>

                <section style={s.contentGrid}>
                    <div style={s.mainColumn}>
                        <div style={s.card}>
                            <div style={s.cardHeader}>
                                <div>
                                    <div style={s.sectionLabel}>Quick access</div>
                                    <div style={s.cardTitle}>Entradas principales del proyecto</div>
                                </div>
                            </div>

                            <div style={s.quickGrid}>
                                <button style={s.quickAction} onClick={() => navigate(`/projects/${id}/backlog`, { state: { projectName } })}>
                                    Backlog
                                </button>
                                <button style={s.quickAction} onClick={() => navigate(`/projects/${id}/backlog`, { state: { projectName } })}>
                                    Work item blockers
                                </button>
                                <button style={s.quickAction} onClick={() => navigate('/leaderboard')}>
                                    Leaderboard
                                </button>
                                <button style={s.quickAction} onClick={() => navigate('/audit')}>
                                    Audit trail
                                </button>
                            </div>
                        </div>

                        <div style={s.card}>
                            <div style={s.cardHeader}>
                                <div>
                                    <div style={s.sectionLabel}>Backlog snapshot</div>
                                    <div style={s.cardTitle}>Resumen rápido de ítems</div>
                                </div>
                            </div>

                            <div style={s.snapshotList}>
                                {backlogItems.slice(0, 3).map((item) => (
                                    <div key={item.id} style={s.snapshotRow}>
                                        <div>
                                            <div style={s.snapshotTitle}>{item.title}</div>
                                            <div style={s.snapshotMeta}>{item.type} · {item.assignee} · {item.storyPoints} SP</div>
                                        </div>
                                        <button style={s.snapshotBtn} onClick={() => navigate(`/projects/${id}/backlog/${item.id}`, { state: { projectName } })}>
                                            View
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <aside style={s.sideColumn}>
                        <div style={s.sideCard}>
                            <div style={s.sectionLabel}>Project focus</div>
                            <div style={s.sideText}>
                                Esta pantalla es solo visual. La interacción detallada de bloqueos vive dentro del detalle del work item.
                            </div>
                        </div>

                        <div style={s.sideCard}>
                            <div style={s.sectionLabel}>Alert</div>
                            <div style={s.alertBox}>
                                {blockedItems > 0 ? `${blockedItems} item(s) tienen bloqueadores activos.` : 'No active blockers.'}
                            </div>
                        </div>
                    </aside>
                </section>
            </div>
        </div>
    );
}

const s = {
    page: { minHeight:'100vh', backgroundColor:'#F5F5F4', fontFamily:"'DM Sans','Helvetica Neue',sans-serif", color:'#1A1A1A' },
    topBar: {
        backgroundColor:'#FFF',
        borderBottom:'1px solid #E5E5E3',
        padding:'0 32px',
        height:56,
        display:'flex',
        alignItems:'center',
        justifyContent:'space-between',
    },
    breadcrumb: { display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#888' },
    backlogBtn: { height:36, padding:'0 16px', backgroundColor:'#1A1A1A', color:'#FFF', border:'none', borderRadius:4, fontSize:13, fontWeight:600, cursor:'pointer' },
    body: { padding:32, maxWidth:1320 },
    heroCard: { backgroundColor:'#FFF', border:'1px solid #E7E4DD', borderRadius:8, padding:24, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, marginBottom:16 },
    kicker: { fontSize:10, letterSpacing:'0.08em', textTransform:'uppercase', color:'#8A8A8A', fontWeight:700, marginBottom:8 },
    title: { fontSize:28, lineHeight:1.1, margin:0, marginBottom:10 },
    subtitle: { fontSize:13, color:'#6C6C6C', maxWidth:780, lineHeight:1.5 },
    heroActions: { display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10 },
    primaryBtn: { height:36, padding:'0 16px', backgroundColor:'#D92F47', color:'#FFF', border:'none', borderRadius:4, fontSize:13, fontWeight:600, cursor:'pointer' },
    heroTag: { display:'inline-flex', alignItems:'center', borderRadius:999, padding:'5px 10px', fontSize:10, fontWeight:700, color:'#2453C9', backgroundColor:'#E7EEFF' },
    statsGrid: { display:'grid', gridTemplateColumns:'repeat(4, minmax(0, 1fr))', gap:12, marginBottom:16 },
    statCard: { backgroundColor:'#FFF', border:'1px solid #E7E4DD', borderRadius:8, padding:16, display:'grid', gap:6 },
    statLabel: { fontSize:10, letterSpacing:'0.06em', textTransform:'uppercase', color:'#8A8A8A', fontWeight:700 },
    statValue: { fontSize:26, fontWeight:700, color:'#1A1A1A' },
    statValueDanger: { fontSize:26, fontWeight:700, color:'#D92F47' },
    statHint: { fontSize:12, color:'#7B7B7B' },
    progressTrack: { display:'block', width:'100%', height:6, borderRadius:999, backgroundColor:'#E9E4DA', overflow:'hidden', marginTop:4 },
    progressFill: { display:'block', height:'100%', borderRadius:999, backgroundColor:'#D92F47' },
    contentGrid: { display:'grid', gridTemplateColumns:'minmax(0, 1fr) 320px', gap:16, alignItems:'start' },
    mainColumn: { display:'grid', gap:16 },
    sideColumn: { display:'grid', gap:16 },
    card: { backgroundColor:'#FFF', border:'1px solid #E7E4DD', borderRadius:8, padding:18 },
    cardHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 },
    sectionLabel: { fontSize:10, letterSpacing:'0.08em', textTransform:'uppercase', color:'#8A8A8A', fontWeight:700, marginBottom:4 },
    cardTitle: { fontSize:16, fontWeight:700, color:'#2C2C2C' },
    quickGrid: { display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:10 },
    quickAction: { height:44, border:'1px solid #DEDAD0', borderRadius:6, backgroundColor:'#FFF', color:'#444', fontSize:13, fontWeight:600, cursor:'pointer' },
    snapshotList: { display:'grid', gap:10 },
    snapshotRow: { display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'12px 0', borderBottom:'1px solid #F1EEE8' },
    snapshotTitle: { fontSize:14, fontWeight:600, color:'#1A1A1A', marginBottom:3 },
    snapshotMeta: { fontSize:12, color:'#7B7B7B' },
    snapshotBtn: { height:30, padding:'0 12px', border:'1px solid #DEDAD0', borderRadius:6, backgroundColor:'#FFF', fontSize:12, cursor:'pointer' },
    sideCard: { backgroundColor:'#FFF', border:'1px solid #E7E4DD', borderRadius:8, padding:18 },
    sideText: { fontSize:13, color:'#666', lineHeight:1.5 },
    alertBox: { borderRadius:6, backgroundColor:'#FFF5F7', border:'1px solid #F3CDD3', color:'#B71C1C', padding:12, fontSize:13, fontWeight:600 },
};