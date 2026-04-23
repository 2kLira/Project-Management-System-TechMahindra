import { useLocation, useNavigate, useParams } from 'react-router-dom';
import './ViewerProjectBacklogPage.css';
import {
    getBacklogItemsForProject,
    getStatusBadgeColors,
    getTypeBadgeColors,
    initialsFromName,
} from './viewerBacklogMock';

export default function ViewerProjectBacklogPage() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // If route state is missing (e.g. page refresh), fallback to a safe title.
    const projectName = location.state?.projectName || `Project ${id}`;
    const backlogRows = getBacklogItemsForProject(id);

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
                                        <tr key={item.id} className={item.blockerCount > 0 ? 'vpb-highlight-row' : undefined}>
                                            <td className="vpb-td-item">
                                                <div className={item.blockerCount > 0 ? 'vpb-item-important' : undefined}>{item.title}</div>
                                                {item.blockedSummary && <div className="vpb-blocked-text">⚠ {item.blockedSummary}</div>}
                                            </td>
                                            <td className="vpb-td">
                                                <span className="vpb-pill" style={{ color: type.color, backgroundColor: type.bg }}>{item.type}</span>
                                            </td>
                                            <td className="vpb-td-strong">{item.storyPoints}</td>
                                            <td className={String(item.targetDate || '').includes('Overdue') ? 'vpb-td vpb-target-overdue' : 'vpb-td vpb-target-warn'}>{item.targetDate}</td>
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
                                                <button
                                                    className="vpb-view-btn"
                                                    onClick={() => navigate(`/projects/${id}/backlog/${item.id}`, { state: { projectName } })}
                                                >
                                                    View
                                                </button>
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