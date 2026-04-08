const express = require('express');
const router = express.Router();

const {
    getProjects,
    createProject
} = require('./projects.controller');

router.get('/', getProjects);
router.post('/create', createProject);

module.exports = router;