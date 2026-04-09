const express = require('express');
const router = express.Router();
const { login, register, verify_token, logout, me } = require('./auth.controller');
const { authUser } = require('../middleware/auth');

router.post('/login', login);
router.post('/register', register);
router.get('/verify', verify_token);
router.get('/me', authUser, me);
router.post('/logout', logout);

module.exports = router;