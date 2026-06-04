const { z } = require('zod');

const updateAlertConfigSchema = z.object({
    notify_to_yellow:     z.boolean({ message: 'notify_to_yellow debe ser booleano' }),
    notify_to_red:        z.boolean({ message: 'notify_to_red debe ser booleano' }),
    notify_score_jump:    z.boolean({ message: 'notify_score_jump debe ser booleano' }),
    // El body es JSON con un número real; sin coerce para evitar footguns (p.ej. [25] → 25).
    score_jump_threshold: z.number({ message: 'score_jump_threshold debe ser un número' })
        .int().min(5, 'El umbral mínimo es 5').max(50, 'El umbral máximo es 50'),
});

module.exports = { updateAlertConfigSchema };
