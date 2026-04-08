const express = require('express');
const router = express.Router();
const { 
  addViewerToProject, 
  removeViewerFromProject, 
  getProjectViewers,
  getMyProjects,
  getAvailableViewers
} = require('./projects.controller');
const { authenticateToken, requireProjectPM } = require('../middleware/auth.middleware');

// Obtener proyectos del usuario actual (PM o Viewer)
router.get('/my-projects', authenticateToken, getMyProjects);

// Rutas de gestión de viewers (requieren ser PM del proyecto)
router.get('/:projectId/viewers', authenticateToken, requireProjectPM, getProjectViewers);
router.get('/:projectId/available-viewers', authenticateToken, requireProjectPM, getAvailableViewers);
router.post('/:projectId/viewers', authenticateToken, requireProjectPM, addViewerToProject);
router.delete('/:projectId/viewers/:userId', authenticateToken, requireProjectPM, removeViewerFromProject);

module.exports = router;
