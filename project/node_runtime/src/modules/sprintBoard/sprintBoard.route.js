const express = require('express')
const router = express.Router();

const { getSprint, createWorkItem, getWorkItem } = require('./sprintBoard.controller')

router.get('/:id_sprint/getSprintInfo', getSprint)
router.post('/:id_sprint/createWorkItem', createWorkItem)
router.get('/:id_sprint/getWorkItems', getWorkItem)

module.exports = router;