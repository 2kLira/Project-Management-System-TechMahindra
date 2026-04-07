const express = require('express');
const router = express.Router();
const { login, register, verify_token, logout } = require('./auth.controller');

router.post('/login', login);
router.post('/register', register);
router.get('/verify', verify_token);
router.post('/logout', logout);

module.exports = router;