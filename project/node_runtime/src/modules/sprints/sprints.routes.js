const express = require('express')
const router = express.Router();

const { consult_sprints, create_sprint } = require('./sprints.controller')


router.get('/:project_id/sprints', consult_sprints)
router.post('/:project_id/create-sprint', create_sprint)

module.exports = router;