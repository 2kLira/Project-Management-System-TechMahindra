const express = require('express');
const router = express.Router();

const {
    getProjects,
    getManagers,
    getViewers,
    createProject,
} = require('./projects.controller');

const { authUser, requireRole } = require('../middleware/auth');

// Lectura: cualquier usuario autenticado
router.get('/', authUser, getProjects);

// Catálogos para el formulario: solo admin y PM pueden ver candidatos
router.get('/managers', authUser, requireRole('admin', 'pm'), getManagers);
router.get('/viewers', authUser, requireRole('admin', 'pm'), getViewers);
router.post('/create', authUser, requireRole('admin', 'pm'), createProject);
module.exports = router;