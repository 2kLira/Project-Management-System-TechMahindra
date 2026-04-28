const { z } = require('zod');

// id_sprint es requerido (NOT NULL en DB).
// id_project se usa solo para autorización en el controller.
const createWorkItemSchema = z.object({
    id_project: z.coerce.number({ message: 'id_project es requerido' }),
    id_sprint:  z.coerce.number({ message: 'id_sprint es requerido — selecciona un sprint' }),
    title:      z.string().min(1, 'El título es obligatorio').max(255),
    description: z.string().optional().nullable(),
    assignee_id: z.coerce.number().optional().nullable(),
});

const assignWorkItemSchema = z.object({
    assignee_id: z.union([z.coerce.number(), z.null()]),
});

const updateStatusSchema = z.object({
    status: z.enum(['todo', 'in_progress', 'done'], {
        message: "CA-02: el estado debe ser 'todo', 'in_progress' o 'done'",
    }),
});

module.exports = { createWorkItemSchema, assignWorkItemSchema, updateStatusSchema };