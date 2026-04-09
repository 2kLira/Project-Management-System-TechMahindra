const express = require('express');
const router = express.Router();

const { getUsers, updateStatus, updateRole } = require('./users.controller');

router.get('/', getUsers);
router.put('/status/:id', updateStatus);
router.put('/role/:id', updateRole);

module.exports = router;
