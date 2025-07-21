const express = require('express');
const router = express.Router();
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskStatus
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

// Get all tasks for a project
router.get('/project/:projectId', protect, getTasks);

// Create a task
router.post('/project/:projectId', protect, createTask);

// Update and delete task
router.route('/:id')
  .put(protect, updateTask)
  .delete(protect, deleteTask);

// Toggle task status
router.put('/:id/status', protect, toggleTaskStatus);

module.exports = router; 