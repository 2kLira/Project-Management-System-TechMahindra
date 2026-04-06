const express = require('express');
const router = express.Router();
const { login, register, verify_token } = require('./auth.controller');

router.post('/login', login);
router.post('/register', register);
router.get('/verify', verify_token);

module.exports = router;