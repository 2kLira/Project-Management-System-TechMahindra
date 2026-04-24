const { z } = require('zod');

// Crear item. id_sprint es opcional — un item puede estar en el backlog
// sin sprint asignado todavía.
const createWorkItemSchema = z.object({
    id_project: z.coerce.number({ message: 'id_project es requerido' }),
    id_sprint: z.coerce.number().optional().nullable(),
    title: z.string().min(1, 'El título es obligatorio').max(255),
    description: z.string().optional().nullable(),
    assignee_id: z.coerce.number().optional().nullable(),
});

// HU-09 — asignar / reasignar. assignee_id puede ser null (desasignar).
const assignWorkItemSchema = z.object({
    assignee_id: z.union([z.coerce.number(), z.null()]),
});

// HU-10 — cambiar estado. CA-02: solo 'todo', 'in_progress', 'done'.
const updateStatusSchema = z.object({
    status: z.enum(['todo', 'in_progress', 'done'], {
        message: "CA-02: el estado debe ser 'todo', 'in_progress' o 'done'",
    }),
});

module.exports = {
    createWorkItemSchema,
    assignWorkItemSchema,
    updateStatusSchema,
};