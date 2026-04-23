import { NavLink } from 'react-router-dom';

const PROJECT_MENU_ITEMS = [
    { key: 'dashboard', label: 'Dashboard', icon: '▣', kind: 'link', suffix: 'view' },
    { key: 'backlog', label: 'Backlog', icon: '▤', kind: 'link', suffix: 'backlog' },
    { key: 'sprints', label: 'Sprints', icon: '◫', kind: 'link', suffix: 'sprints' },
    { key: 'board', label: 'Sprint Board', icon: '▥', kind: 'static'},
    { key: 'cost', label: 'Submit Cost', icon: '◍', kind: 'static' },
];

export default function SidebarViewerProjectSection({ projectId, sectionLabel, projectNameState, projectMenuClass }) {
    return (
        <div className="sb-section">
            <div className="sb-section-label">{sectionLabel}</div>

            {PROJECT_MENU_ITEMS.map((item) => {
                if (item.kind === 'static') {
                    return (
                        <div key={item.key} className="sb-nav-item sb-nav-item-project">
                            <span className="sb-icon">{item.icon}</span>
                            {item.label}
                        </div>
                    );
                }

                return (
                    <NavLink
                        key={item.key}
                        to={`/projects/${projectId}/${item.suffix}`}
                        state={{ projectName: projectNameState }}
                        className={projectMenuClass}
                    >
                        <span className="sb-icon">{item.icon}</span>
                        {item.label}
                    </NavLink>
                );
            })}
        </div>
    );
}