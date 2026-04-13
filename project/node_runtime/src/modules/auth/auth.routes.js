const express = require('express');
const router = express.Router();
const { login, register, verify_token, logout, me } = require('./auth.controller');
const { authUser, requireRole } = require('../../shared/middleware/auth');
const { validate } = require('../../shared/validators/validate');
const { loginSchema, registerSchema } = require('./auth.validation');

router.post('/login', validate(loginSchema), login);
router.post('/register', authUser, requireRole('admin'), validate(registerSchema), register);
router.get('/verify', verify_token);
router.get('/me', authUser, me);
router.post('/logout', logout);

module.exports = router;
