export const VIEWER_BACKLOG_ITEMS = [
    {
        id: 1,
        projectId: '1',
        title: 'Implement OAuth 2.0 login flow',
        description: 'Integrate the corporate SSO provider and keep the login experience aligned with the bank security policy.',
        type: 'User Story',
        status: 'In Progress',
        storyPoints: 8,
        targetDate: 'Mar 8 - Overdue',
        assignee: 'Laura Castillo',
        sprintLabel: 'Sprint 4',
        blockedSummary: 'Active blocker: API endpoints are outdated',
        blockerCount: 1,
    },
    {
        id: 2,
        projectId: '1',
        title: 'Build token refresh mechanism',
        description: 'Keep sessions alive for corporate SSO without forcing the viewer to relogin too often.',
        type: 'Task',
        status: 'In Progress',
        storyPoints: 3,
        targetDate: 'Mar 12 - 2 days',
        assignee: 'Ravi Kumar',
        sprintLabel: 'Sprint 4',
        blockedSummary: '',
        blockerCount: 0,
    },
    {
        id: 3,
        projectId: '1',
        title: 'Write unit tests for auth module',
        description: 'Cover login, refresh and protected route behavior before enabling the SSO rollout.',
        type: 'Task',
        status: 'To Do',
        storyPoints: 2,
        targetDate: 'Mar 14 - 4 days',
        assignee: 'Anita Desai',
        sprintLabel: 'Sprint 4',
        blockedSummary: '',
        blockerCount: 0,
    },
    {
        id: 4,
        projectId: '1',
        title: 'Fix login page redirect on timeout',
        description: 'Prevent the UI from losing context when the session expires during the auth flow.',
        type: 'Bug',
        status: 'To Do',
        storyPoints: 1,
        targetDate: 'Mar 15 - 5 days',
        assignee: 'Priya Singh',
        sprintLabel: 'Sprint 4',
        blockedSummary: '',
        blockerCount: 0,
    },
    {
        id: 5,
        projectId: '1',
        title: 'Set-up development environment',
        description: 'Prepare the local auth stack and project defaults for the viewer team.',
        type: 'Task',
        status: 'Done',
        storyPoints: 2,
        targetDate: 'Mar 3 - On time',
        assignee: 'Carlos Mendoza',
        sprintLabel: 'Sprint 4',
        blockedSummary: '',
        blockerCount: 0,
    },
];

export function getBacklogItemsForProject(projectId) {
    return VIEWER_BACKLOG_ITEMS.filter((item) => String(item.projectId) === String(projectId)).length > 0
        ? VIEWER_BACKLOG_ITEMS.filter((item) => String(item.projectId) === String(projectId))
        : VIEWER_BACKLOG_ITEMS;
}

export function getBacklogItemById(projectId, itemId) {
    return VIEWER_BACKLOG_ITEMS.find(
        (item) => String(item.projectId) === String(projectId) && String(item.id) === String(itemId)
    ) || VIEWER_BACKLOG_ITEMS.find((item) => String(item.id) === String(itemId));
}

export function getTypeBadgeColors(type) {
    if (type === 'Bug') return { color: '#B94A48', bg: '#FCE9E9' };
    if (type === 'User Story') return { color: '#3162D1', bg: '#E7EEFF' };
    return { color: '#3C9A57', bg: '#E9F7ED' };
}

export function getStatusBadgeColors(status) {
    if (status === 'Done') return { color: '#3C9A57', bg: '#E9F7ED' };
    if (status === 'In Progress') return { color: '#3162D1', bg: '#E7EEFF' };
    return { color: '#7E8693', bg: '#EEF1F5' };
}

export function initialsFromName(name) {
    const parts = String(name || '').split(' ').filter(Boolean);
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
}