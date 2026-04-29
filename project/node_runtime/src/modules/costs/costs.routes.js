const express = require('express');
const router  = express.Router();

const { listCosts, submitCost, decideCost, updateBudget } = require('./costs.controller');
const { authUser, requireRole } = require('../../shared/middleware/auth');
const { validate }              = require('../../shared/validators/validate');
const { submitCostSchema, decisionSchema } = require('./costs.validation');

// GET  /costs?project_id=:id  — todos los roles autenticados (filtro por rol en controller)
router.get('/', authUser, listCosts);

// POST /costs  — viewer y pm pueden registrar costos (CA-03: siempre pending)
router.post(
    '/',
    authUser,
    validate(submitCostSchema),
    submitCost
);

// PATCH /costs/:id/decision  — solo pm y admin pueden aprobar/rechazar (CA-01)
router.patch(
    '/:id/decision',
    authUser,
    requireRole('pm', 'admin'),
    validate(decisionSchema),
    decideCost
);

// PATCH /costs/budget/:project_id  — pm/admin actualizan presupuesto estimado
router.patch(
    '/budget/:project_id',
    authUser,
    requireRole('pm', 'admin'),
    updateBudget
);

module.exports = router;