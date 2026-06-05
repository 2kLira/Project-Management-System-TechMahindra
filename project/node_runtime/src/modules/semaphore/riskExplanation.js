// HU-18 — Explicación automática del riesgo detectado.
// Genera texto ≤150 palabras cuando el semáforo es amarillo o rojo.
// Función pura: sin acceso a BD; el controller pasa los inputs.

function cap(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function generateRiskExplanation({
    semaforo,         // 'verde' | 'amarillo' | 'rojo'
    desviacion,       // pp (negativo = retraso)
    deadline,         // ISO string | null
    avance_real,      // 0–100
    costo_aprobado,
    presupuesto,      // 0 = desconocido
    blockers,         // [{ severity, approval_status, created_at }]
    activeRisks,      // [{ level }]
    recentSP,
    expectedWeeklySP,
    allPastSprints,   // opcional: [{ doneSp, assignedSp }] para CA-03
}) {
    if (semaforo === 'verde') return null;

    const now       = new Date();
    const daysLeft  = deadline
        ? Math.ceil((new Date(deadline) - now) / 86_400_000)
        : null;
    const costRatio = presupuesto > 0 ? costo_aprobado / presupuesto : 0;

    const criticals = (blockers || []).filter(
        b => b.severity === 'critical' && ['pending', 'approved'].includes(b.approval_status)
    );
    const highRisks = (activeRisks || []).filter(r => r.level === 'high');

    // ── Detectar causas en orden de prioridad ────────────────────────────────
    const parts = [];

    if (daysLeft !== null && daysLeft < 0 && avance_real < 100) {
        parts.push({
            cause:       `el proyecto superó su fecha límite hace ${Math.abs(daysLeft)} día(s) con un avance del ${avance_real.toFixed(0)}%`,
            consequence: 'riesgo de incumplimiento contractual y retraso en la entrega al cliente',
        });
    }

    if (costRatio > 1.0) {
        parts.push({
            cause:       `el gasto aprobado excede el presupuesto en un ${Math.round((costRatio - 1) * 100)}%`,
            consequence: 'posible necesidad de aprobación adicional de recursos financieros',
        });
    } else if (costRatio > 0.85) {
        parts.push({
            cause:       `el gasto aprobado alcanzó el ${Math.round(costRatio * 100)}% del presupuesto total`,
            consequence: 'riesgo de sobrecosto antes de concluir el proyecto',
        });
    }

    if (criticals.length >= 2) {
        parts.push({
            cause:       `${criticals.length} bloqueadores críticos activos sin resolver`,
            consequence: 'paralización de actividades clave y reducción de la velocidad del equipo',
        });
    } else if (criticals.length === 1) {
        parts.push({
            cause:       'un bloqueador crítico activo sin resolver',
            consequence: 'posible detención de actividades en el área afectada',
        });
    }

    if (desviacion <= -20) {
        parts.push({
            cause:       `retraso severo de ${Math.abs(desviacion).toFixed(0)} puntos porcentuales respecto al plan`,
            consequence: 'compromiso del deadline sin medidas correctivas inmediatas',
        });
    } else if (desviacion <= -10) {
        parts.push({
            cause:       `retraso de ${Math.abs(desviacion).toFixed(0)} puntos porcentuales respecto al avance esperado`,
            consequence: 'riesgo de no alcanzar los hitos planeados en los próximos sprints',
        });
    }

    if (expectedWeeklySP > 0 && recentSP < expectedWeeklySP * 0.5) {
        parts.push({
            cause:       `velocidad de cierre de la última semana (${recentSP} SP) inferior a la mitad de la esperada (${Math.round(expectedWeeklySP)} SP)`,
            consequence: 'tendencia que puede ampliar el retraso si no se recupera el ritmo',
        });
    }

    if (highRisks.length > 0) {
        parts.push({
            cause:       `${highRisks.length} riesgo(s) de nivel alto activo(s)`,
            consequence: 'posible impacto en el alcance, calidad o costo del proyecto',
        });
    }

    if (daysLeft !== null && daysLeft >= 0 && daysLeft <= 7) {
        parts.push({
            cause:       `quedan solo ${daysLeft} día(s) para el deadline con un avance del ${avance_real.toFixed(0)}%`,
            consequence: 'margen crítico para completar el trabajo restante',
        });
    }

    if (parts.length === 0) {
        parts.push({
            cause:       'combinación de factores que elevan el nivel de riesgo del proyecto',
            consequence: 'posible desviación del plan si no se toman acciones preventivas',
        });
    }

    // ── Armar texto (máximo 2 causas) ────────────────────────────────────────
    const top = parts.slice(0, 2);
    let text = '';

    if (top.length === 1) {
        text = `Causa: ${cap(top[0].cause)}. Posible consecuencia: ${cap(top[0].consequence)}.`;
    } else {
        text = `Causas: (1) ${cap(top[0].cause)}; (2) ${cap(top[1].cause)}. Posible consecuencia: ${cap(top[0].consequence)}.`;
    }

    // ── CA-03: Comparación con comportamiento histórico ───────────────────────
    if (Array.isArray(allPastSprints) && allPastSprints.length >= 2) {
        const cleanSprints = allPastSprints.filter(s => (s.assignedSp || 0) > 0);
        if (cleanSprints.length >= 2 && expectedWeeklySP > 0) {
            const avgDoneSp = cleanSprints.reduce((a, s) => a + (s.doneSp || 0), 0) / cleanSprints.length;
            if (avgDoneSp > 0) {
                let comparison;
                if (recentSP < avgDoneSp * 0.8)      comparison = `por debajo del promedio histórico (${avgDoneSp.toFixed(0)} SP/sprint)`;
                else if (recentSP > avgDoneSp * 1.2) comparison = `por encima del promedio histórico (${avgDoneSp.toFixed(0)} SP/sprint)`;
                else                                  comparison = `cercano al promedio histórico (${avgDoneSp.toFixed(0)} SP/sprint)`;
                text += ` El ritmo reciente de ${recentSP} SP está ${comparison}.`;
            }
        }
    }

    // ── CA-04: Límite de 150 palabras ────────────────────────────────────────
    const words = text.trim().split(/\s+/);
    if (words.length > 150) text = words.slice(0, 150).join(' ') + '…';

    return text.trim();
}

module.exports = { generateRiskExplanation };
