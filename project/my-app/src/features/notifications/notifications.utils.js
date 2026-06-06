// HU-27 — etiquetas, iconos y formato de fecha para las notificaciones.
// Emojis permitidos SOLO aquí: son indicadores de estado del semáforo (spec §7.4).

export const KIND_LABELS = {
    risk_to_red:     'Semáforo crítico',
    risk_to_yellow:  'Semáforo en alerta',
    risk_score_jump: 'Aumento de score de riesgo',
};

export const KIND_ICONS = {
    risk_to_red:     '🔴',
    risk_to_yellow:  '🟡',
    risk_score_jump: '📈',
};

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/**
 * Fecha relativa en español: "hace N min", "hace N h", "ayer", "dd mmm".
 * @param {string} iso ISO date string
 */
export function formatRelativeTime(iso) {
    if (!iso) return '';
    const then = new Date(iso);
    if (Number.isNaN(then.getTime())) return '';

    const now = new Date();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'hace un momento';
    if (diffMin < 60) return `hace ${diffMin} min`;

    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `hace ${diffH} h`;

    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startThen  = new Date(then.getFullYear(), then.getMonth(), then.getDate());
    const dayDiff = Math.round((startToday - startThen) / 86400000);
    if (dayDiff === 1) return 'ayer';

    return `${then.getDate()} ${MESES[then.getMonth()]}`;
}
