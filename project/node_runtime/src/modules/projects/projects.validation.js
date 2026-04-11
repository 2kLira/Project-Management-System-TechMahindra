const { z } = require('zod');

const createProjectSchema = z.object({
    project_name: z.string().min(1, 'Project name is required'),
    client_name: z.string().min(1, 'Client name is required'),
    id_pm: z.number({ message: 'PM ID is required (CA-03)' }),
    description: z.string().optional().nullable(),
    start_date: z.string().optional().nullable(),
    deadline: z.string().optional().nullable(),
    estimated_sp: z.number().optional().nullable(),
    viewer_ids: z.array(z.number()).optional().default([]),
});

const addViewerSchema = z.object({
    viewer_id: z.number({ message: 'viewer_id is required' }),
});

module.exports = { createProjectSchema, addViewerSchema };
