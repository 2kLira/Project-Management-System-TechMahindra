import { useLocation, useNavigate, useParams } from 'react-router-dom';
import './ViewerProjectBacklogPage.css';

// Visual-only rows while real backlog assignment flow is still pending.
const backlogRows = [
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

function initialsFromName(name) {
    const parts = String(name || '').split(' ').filter(Boolean);
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
}

function getTypeBadgeColors(type) {
    if (type === 'Bug') return { color: '#B94A48', bg: '#FCE9E9' };
    if (type === 'User Story') return { color: '#3162D1', bg: '#E7EEFF' };
    return { color: '#3C9A57', bg: '#E9F7ED' };
}

function getStatusBadgeColors(status) {
    if (status === 'Done') return { color: '#3C9A57', bg: '#E9F7ED' };
    if (status === 'In Progress') return { color: '#3162D1', bg: '#E7EEFF' };
    return { color: '#7E8693', bg: '#EEF1F5' };
}

export default function ViewerProjectBacklogPage() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // If route state is missing (e.g. page refresh), fallback to a safe title.
    const projectName = location.state?.projectName || `Project ${id}`;

    return (
        <div className="vpb-page">
            <div className="vpb-top-bar">
                <div className="vpb-breadcrumb">
                    <span className="vpb-crumb-accent">{projectName}</span>
                    <span>/</span>
                    <span className="vpb-crumb-accent">Sprint 4 Board</span>
                    <span>/</span>
                    <span>Backlog</span>
                </div>
                <button className="vpb-back-btn" onClick={() => navigate(`/projects/${id}/view`, { state: { projectName } })}>
                    ← Back to Board
                </button>
            </div>

            <div className="vpb-content-wrap">
                <h1 className="vpb-title">Backlog</h1>

                <div className="vpb-table-card">
                    <div className="vpb-table-scroll">
                        <table className="vpb-table">
                            <thead>
                                <tr>
                                    <th className="vpb-th-item">ITEM</th>
                                    <th className="vpb-th">TYPE</th>
                                    <th className="vpb-th">SP</th>
                                    <th className="vpb-th">TARGET DATE</th>
                                    <th className="vpb-th">STATUS</th>
                                    <th className="vpb-th">ASSIGNEE</th>
                                    <th className="vpb-th">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {backlogRows.map((item) => {
                                    const type = getTypeBadgeColors(item.type);
                                    const status = getStatusBadgeColors(item.status);

                                    // Highlight urgent row to mirror the design reference.
                                    return (
                                        <tr key={item.id} className={item.highlight ? 'vpb-highlight-row' : undefined}>
                                            <td className="vpb-td-item">
                                                <div className={item.highlight ? 'vpb-item-important' : undefined}>{item.title}</div>
                                                {item.blocked && <div className="vpb-blocked-text">⚠ {item.blocked}</div>}
                                            </td>
                                            <td className="vpb-td">
                                                <span className="vpb-pill" style={{ color: type.color, backgroundColor: type.bg }}>{item.type}</span>
                                            </td>
                                            <td className="vpb-td-strong">{item.sp}</td>
                                            <td className={item.target.includes('Overdue') ? 'vpb-td vpb-target-overdue' : 'vpb-td vpb-target-warn'}>{item.target}</td>
                                            <td className="vpb-td">
                                                <span className="vpb-pill" style={{ color: status.color, backgroundColor: status.bg }}>{item.status}</span>
                                            </td>
                                            <td className="vpb-td">
                                                <div className="vpb-assignee-wrap">
                                                    <span className="vpb-avatar">{initialsFromName(item.assignee).toUpperCase()}</span>
                                                    <span>{item.assignee}</span>
                                                </div>
                                            </td>
                                            <td className="vpb-td">
                                                <button className="vpb-view-btn">View</button>
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