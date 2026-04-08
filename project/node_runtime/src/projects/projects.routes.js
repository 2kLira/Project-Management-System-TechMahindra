const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const {
    getProjects,
    createProject,
    getManagers,
    getViewers,
    getProjectViewers,
    addViewerToProject,
    removeViewerFromProject
} = require('./projects.controller');

router.use(authMiddleware);

router.get('/', getProjects);
router.post('/create', createProject);
router.get('/managers', getManagers);
router.get('/viewers', getViewers);
router.get('/:id/viewers', getProjectViewers);
router.post('/:id/viewers', addViewerToProject);
router.delete('/:id/viewers/:viewerId', removeViewerFromProject);

module.exports = router;
