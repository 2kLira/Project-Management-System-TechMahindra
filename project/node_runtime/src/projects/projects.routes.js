const express = require('express');
const router = express.Router();

const {
    getProjects,
    getManagers,
    getViewers,
    createProject,
    deleteProject,
} = require('./projects.controller');

const { authUser, requireRole } = require('../middleware/auth');

// Lectura: cualquier usuario autenticado
router.get('/', authUser, getProjects);

// Catálogos para el formulario: solo admin y PM pueden ver candidatos
router.get('/managers', authUser, requireRole('admin', 'pm', 'project_manager'), getManagers);
router.get('/viewers', authUser, requireRole('admin', 'pm', 'project_manager'), getViewers);
router.post('/create', authUser, requireRole('admin', 'pm', 'project_manager'), createProject);
router.delete('/:id', authUser, requireRole('admin', 'pm', 'project_manager'), deleteProject);
module.exports = router;