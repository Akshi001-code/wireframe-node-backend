const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

// Middleware to extract userId from auth (e.g., req.userId)
const verifyUser = require('../middleware/verifyUser');

router.use(verifyUser);

router.get('/', projectController.getProjects);
router.post('/', projectController.addProject);
router.put('/:id', projectController.editProject);
router.delete('/:id', projectController.deleteProject);

module.exports = router;
