const express = require('express');
const router = express.Router();

const {
    getProjects,
    getManagers,
    getViewers,
    createProject,
    getProjectViewers,
    addViewerToProject,
    removeViewerFromProject,
} = require('./projects.controller');

const { authUser, requireRole } = require('../middleware/auth');

// Lectura: cualquier usuario autenticado (filtrado por rol en controller - CA-04)
router.get('/', authUser, getProjects);

// Catálogos para formularios: solo admin y PM
router.get('/managers', authUser, requireRole('admin', 'pm'), getManagers);
router.get('/viewers', authUser, requireRole('admin', 'pm'), getViewers);
router.post('/create', authUser, requireRole('admin', 'pm'), createProject);

// HU-08: gestión de viewers en proyectos existentes
router.get('/:id/viewers', authUser, requireRole('admin', 'pm'), getProjectViewers);
router.post('/:id/viewers', authUser, requireRole('admin', 'pm'), addViewerToProject);
router.delete('/:id/viewers/:viewer_id', authUser, requireRole('admin', 'pm'), removeViewerFromProject);

module.exports = router;
