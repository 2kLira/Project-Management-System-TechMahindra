// HU-27 — Reglas de disparo de alertas por cambio de riesgo (función pura, sin BD).
// Tres reglas en orden; la primera que matchea gana. Mejorías y "sin baseline" no alertan.

const DEFAULT_CONFIG = {
    notify_to_yellow:     true,
    notify_to_red:        true,
    notify_score_jump:    true,
    score_jump_threshold: 15,
};

function evaluateAlert({ previousScore, previousStatus, newScore, newStatus, config }) {
    if (previousStatus == null) return null;
    const cfg = { ...DEFAULT_CONFIG, ...(config || {}) };

    if (newStatus === 'red' && previousStatus !== 'red' && cfg.notify_to_red) {
        return {
            kind:    'risk_to_red',
            subject: 'Semáforo crítico',
            write:   `Semáforo cambió a rojo (score ${newScore})`,
        };
    }
    if (newStatus === 'yellow' && previousStatus === 'green' && cfg.notify_to_yellow) {
        return {
            kind:    'risk_to_yellow',
            subject: 'Semáforo en alerta',
            write:   `Semáforo cambió a amarillo (score ${newScore})`,
        };
    }
    const delta = newScore - previousScore;
    if (delta >= cfg.score_jump_threshold && cfg.notify_score_jump) {
        return {
            kind:    'risk_score_jump',
            subject: 'Aumento de score de riesgo',
            write:   `Score subió ${delta} puntos (${previousScore} → ${newScore})`,
        };
    }
    return null;
}

module.exports = { evaluateAlert, DEFAULT_CONFIG };
