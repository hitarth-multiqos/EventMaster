const express = require('express');
const router = express.Router();
const projectController = require('../../controllers/v1/project.controller');

router.get('/', (req, res) => res.send('Welcome to project route'));

router.post('/create-project', projectController.createProject);
router.post('/create-module', projectController.createNewModule);


module.exports = router;