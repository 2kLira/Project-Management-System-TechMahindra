const express = require('express');
const router = express.Router();

const {
    listWorkItems,
    createWorkItem,
    assignWorkItem,
} = require('./work_items.controller');

const { authUser, requireRole } = require('../../shared/middleware/auth');
const { validate } = require('../../shared/validators/validate');
const {
    createWorkItemSchema,
    assignWorkItemSchema,
} = require('./work_items.validation');

// Listar items de un proyecto: cualquier rol autenticado, el controller
// hace el filtro fino por rol/membresía.
router.get('/', authUser, listWorkItems);

// Crear item: solo PM o admin.
router.post(
    '/',
    authUser,
    requireRole('admin', 'pm'),
    validate(createWorkItemSchema),
    createWorkItem
);

// HU-09 — Asignar / reasignar responsable. Solo PM o admin.
router.patch(
    '/:id/assignee',
    authUser,
    requireRole('admin', 'pm'),
    validate(assignWorkItemSchema),
    assignWorkItem
);

module.exports = router;