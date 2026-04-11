const express = require('express');
const router = express.Router();
const { getUsers, updateStatus, updateRole } = require('./users.controller');
const { authUser, requireRole } = require('../../shared/middleware/auth');
const { validate } = require('../../shared/validators/validate');
const { updateStatusSchema, updateRoleSchema } = require('./users.validation');

router.get('/', authUser, requireRole('admin'), getUsers);
router.put('/status/:id', authUser, requireRole('admin'), validate(updateStatusSchema), updateStatus);
router.put('/role/:id', authUser, requireRole('admin'), validate(updateRoleSchema), updateRole);

module.exports = router;
