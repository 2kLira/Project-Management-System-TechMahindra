export default function AuditPage() {
    return (
        <div style={s.page}>
            <div style={s.topBar}>
                <div style={s.breadcrumb}>
                    <span>Inicio</span>
                    <span style={{ color:'#CCC' }}>/</span>
                    <span style={{ color:'#1A1A1A', fontWeight:500 }}>Bitácora</span>
                </div>
            </div>
            <div style={s.body}>
                <h1 style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>Bitácora de auditoría</h1>
                <p style={{ fontSize:13, color:'#888' }}>Registro de eventos del sistema — próximamente disponible.</p>
            </div>
        </div>
    );
}

const s = {
    page:       { minHeight:'100vh', backgroundColor:'#F5F5F4', fontFamily:"'DM Sans',sans-serif" },
    topBar:     { backgroundColor:'#FFF', borderBottom:'1px solid #E5E5E3', padding:'0 32px', height:56, display:'flex', alignItems:'center' },
    breadcrumb: { display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#888' },
    body:       { padding:32 },
};