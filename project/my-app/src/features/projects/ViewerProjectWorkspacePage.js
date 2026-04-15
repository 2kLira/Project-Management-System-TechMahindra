import { useLocation, useParams } from 'react-router-dom';

export default function ViewerProjectWorkspacePage() {
    const { id } = useParams();
    const location = useLocation();
    const projectName = location.state?.projectName || `Proyecto ${id}`;

    return (
        <div style={s.page}>
            <div style={s.topBar}>
                <div style={s.breadcrumb}>
                    <span>Projects</span>
                    <span style={{ color:'#CCC' }}>/</span>
                    <span style={{ color:'#1A1A1A', fontWeight:500 }}>{projectName}</span>
                </div>
            </div>
            <div style={s.body} />
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
    body: { minHeight:'calc(100vh - 56px)' },
};