const { z } = require('zod');

// CA-01: categorías válidas (configuración centralizada)
const VALID_CATEGORIES = [
    'Infrastructure',
    'Software',
    'Consulting',
    'Training',
    'Hardware',
    'Travel',
    'Other',
];

const submitCostSchema = z.object({
    id_project:  z.coerce.number({ message: 'id_project es requerido' }),
    category:    z.string().refine(v => VALID_CATEGORIES.includes(v), {
        message: `CA-01: categoría inválida. Válidas: ${VALID_CATEGORIES.join(', ')}`,
    }),
    amount:      z.coerce.number()
        .gt(0, 'CA-02: el monto debe ser mayor a cero'),
    description: z.string().min(1, 'La descripción es obligatoria').max(500),
    spend_date:  z.string().min(1, 'La fecha es obligatoria'),
});

const decisionSchema = z.object({
    decision: z.enum(['approved', 'rejected'], {
        message: "CA-02: la decisión debe ser 'approved' o 'rejected'",
    }),
});

module.exports = { submitCostSchema, decisionSchema, VALID_CATEGORIES };