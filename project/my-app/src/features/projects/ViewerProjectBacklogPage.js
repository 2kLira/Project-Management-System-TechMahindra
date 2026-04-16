import { useLocation, useNavigate, useParams } from 'react-router-dom';

const MOCK_ITEMS = [
    {
        id: 1,
        title: 'Implement OAuth 2.0 login flow',
        type: 'User Story',
        sp: 8,
        target: 'Mar 8 - Overdue',
        status: 'In Progress',
        assignee: 'Laura Castillo',
        highlight: true,
        blocked: 'Active blocker: 5 days',
    },
    {
        id: 2,
        title: 'Build token refresh mechanism',
        type: 'Task',
        sp: 3,
        target: 'Mar 12 - 2 days',
        status: 'In Progress',
        assignee: 'Ravi Kumar',
    },
    {
        id: 3,
        title: 'Write unit tests for auth module',
        type: 'Task',
        sp: 2,
        target: 'Mar 14 - 4 days',
        status: 'To Do',
        assignee: 'Anita Desai',
    },
    {
        id: 4,
        title: 'Fix login page redirect on timeout',
        type: 'Bug',
        sp: 1,
        target: 'Mar 15 - 5 days',
        status: 'To Do',
        assignee: 'Priya Singh',
    },
    {
        id: 5,
        title: 'Set-up development environment',
        type: 'Task',
        sp: 2,
        target: 'Mar 3 - On time',
        status: 'Done',
        assignee: 'Carlos Mendoza',
    },
];

function getInitials(name) {
    const parts = String(name || '').split(' ').filter(Boolean);
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
}

function typeStyle(type) {
    if (type === 'Bug') return { color: '#B94A48', bg: '#FCE9E9' };
    if (type === 'User Story') return { color: '#3162D1', bg: '#E7EEFF' };
    return { color: '#3C9A57', bg: '#E9F7ED' };
}

function statusStyle(status) {
    if (status === 'Done') return { color: '#3C9A57', bg: '#E9F7ED' };
    if (status === 'In Progress') return { color: '#3162D1', bg: '#E7EEFF' };
    return { color: '#7E8693', bg: '#EEF1F5' };
}

export default function ViewerProjectBacklogPage() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const projectName = location.state?.projectName || `Project ${id}`;

    return (
        <div style={s.page}>
            <div style={s.topBar}>
                <div style={s.breadcrumb}>
                    <span style={s.crumbAccent}>{projectName}</span>
                    <span>/</span>
                    <span style={s.crumbAccent}>Sprint 4 Board</span>
                    <span>/</span>
                    <span>Backlog</span>
                </div>
                <button style={s.backBtn} onClick={() => navigate(`/projects/${id}/view`, { state: { projectName } })}>
                    ← Back to Board
                </button>
            </div>

            <div style={s.contentWrap}>
                <h1 style={s.title}>Backlog</h1>

                <div style={s.tableCard}>
                    <div style={s.tableScroll}>
                        <table style={s.table}>
                            <thead>
                                <tr>
                                    <th style={s.thItem}>ITEM</th>
                                    <th style={s.th}>TYPE</th>
                                    <th style={s.th}>SP</th>
                                    <th style={s.th}>TARGET DATE</th>
                                    <th style={s.th}>STATUS</th>
                                    <th style={s.th}>ASSIGNEE</th>
                                    <th style={s.th}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {MOCK_ITEMS.map((item) => {
                                    const type = typeStyle(item.type);
                                    const status = statusStyle(item.status);
                                    return (
                                        <tr key={item.id} style={item.highlight ? s.highlightRow : undefined}>
                                            <td style={s.tdItem}>
                                                <div style={item.highlight ? s.itemImportant : undefined}>{item.title}</div>
                                                {item.blocked && <div style={s.blockedText}>⚠ {item.blocked}</div>}
                                            </td>
                                            <td style={s.td}>
                                                <span style={{ ...s.pill, color: type.color, backgroundColor: type.bg }}>{item.type}</span>
                                            </td>
                                            <td style={s.tdStrong}>{item.sp}</td>
                                            <td style={{ ...s.td, color: item.target.includes('Overdue') ? '#DA3045' : '#D67C00' }}>{item.target}</td>
                                            <td style={s.td}>
                                                <span style={{ ...s.pill, color: status.color, backgroundColor: status.bg }}>{item.status}</span>
                                            </td>
                                            <td style={s.td}>
                                                <div style={s.assigneeWrap}>
                                                    <span style={s.avatar}>{getInitials(item.assignee).toUpperCase()}</span>
                                                    <span>{item.assignee}</span>
                                                </div>
                                            </td>
                                            <td style={s.td}>
                                                <button style={s.viewBtn}>View</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

const s = {
    page: {
        minHeight: '100vh',
        backgroundColor: '#ECE9E2',
        fontFamily: "'DM Sans','Helvetica Neue',sans-serif",
        color: '#1A1A1A',
    },
    topBar: {
        height: 44,
        padding: '0 18px',
        backgroundColor: '#FFF',
        borderBottom: '1px solid #E4DFD4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    breadcrumb: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#8D8D8D' },
    crumbAccent: { color: '#D83B4D', fontWeight: 500 },
    backBtn: {
        height: 26,
        border: '1px solid #DEDAD0',
        borderRadius: 5,
        backgroundColor: '#FFF',
        fontSize: 11,
        color: '#4A4A4A',
        padding: '0 10px',
        cursor: 'pointer',
    },
    contentWrap: { padding: '14px 18px 24px', width: '100%' },
    title: { fontSize: 30, fontWeight: 700, margin: '6px 0 14px' },
    tableCard: {
        backgroundColor: '#FFF',
        borderRadius: 6,
        border: '1px solid #E5DFD3',
        overflow: 'hidden',
        width: '100%',
    },
    tableScroll: { width: '100%', overflowX: 'auto' },
    table: { width: '100%', minWidth: 980, borderCollapse: 'collapse' },
    th: {
        textAlign: 'left',
        padding: '8px 10px',
        fontSize: 10,
        letterSpacing: '0.06em',
        color: '#8B8B8B',
        borderBottom: '1px solid #ECE6DA',
        backgroundColor: '#F8F6F0',
        whiteSpace: 'nowrap',
    },
    thItem: {
        textAlign: 'left',
        padding: '8px 10px',
        fontSize: 10,
        letterSpacing: '0.06em',
        color: '#8B8B8B',
        borderBottom: '1px solid #ECE6DA',
        backgroundColor: '#F8F6F0',
        width: '34%',
    },
    td: {
        padding: '9px 10px',
        fontSize: 12,
        borderBottom: '1px solid #EFEAE0',
        whiteSpace: 'nowrap',
    },
    tdStrong: {
        padding: '9px 10px',
        fontSize: 12,
        borderBottom: '1px solid #EFEAE0',
        whiteSpace: 'nowrap',
        fontWeight: 600,
    },
    tdItem: {
        padding: '9px 10px',
        fontSize: 12,
        borderBottom: '1px solid #EFEAE0',
    },
    highlightRow: { backgroundColor: '#FFF5F7' },
    itemImportant: { color: '#D92F47', fontWeight: 600 },
    blockedText: { marginTop: 2, fontSize: 11, color: '#E08200' },
    pill: {
        display: 'inline-block',
        borderRadius: 4,
        padding: '2px 7px',
        fontSize: 10,
        fontWeight: 600,
    },
    assigneeWrap: { display: 'flex', alignItems: 'center', gap: 6 },
    avatar: {
        width: 20,
        height: 20,
        borderRadius: '50%',
        backgroundColor: '#E07A00',
        color: '#FFF',
        fontSize: 9,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    viewBtn: {
        height: 26,
        border: '1px solid #DEDAD0',
        borderRadius: 5,
        backgroundColor: '#FFF',
        fontSize: 11,
        color: '#4A4A4A',
        padding: '0 11px',
        cursor: 'pointer',
    },
};