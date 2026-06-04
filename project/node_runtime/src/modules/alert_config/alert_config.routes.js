const express = require('express');
const router = express.Router({ mergeParams: true });
const { getConfig, putConfig } = require('./alert_config.controller');
const { authUser, requireRole } = require('../../shared/middleware/auth');

// requireRole corta a viewers antes del DB lookup; canManage re-valida que el PM sea dueño.
router.get('/', authUser, requireRole('pm', 'admin'), getConfig);
router.put('/', authUser, requireRole('pm', 'admin'), putConfig);

module.exports = router;
