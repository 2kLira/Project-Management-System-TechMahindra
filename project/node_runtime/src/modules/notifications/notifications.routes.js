const express = require('express');
const router = express.Router();
const { listNotifications, markRead, markAllRead } = require('./notifications.controller');
const { authUser } = require('../../shared/middleware/auth');

// Sin requireRole: cualquier rol autenticado gestiona solo sus propias notificaciones.
// read-all antes de :id/read (distinto número de segmentos, pero explícito para claridad)
router.get('/', authUser, listNotifications);
router.patch('/read-all', authUser, markAllRead);
router.patch('/:id/read', authUser, markRead);

module.exports = router;
