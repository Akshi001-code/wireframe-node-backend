const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

router.get('/deadlines', protect, async (req, res) => {
  const now = new Date();
  const windows = [
    { label: '1 day', ms: 24 * 60 * 60 * 1000 },
    { label: '12 hours', ms: 12 * 60 * 60 * 1000 },
    { label: '6 hours', ms: 6 * 60 * 60 * 1000 },
    { label: '3 hours', ms: 3 * 60 * 60 * 1000 },
    { label: '1 hour', ms: 1 * 60 * 60 * 1000 },
  ];
  try {
    // Find all projects for this user
    const projects = await Project.find({ userId: req.user._id });
    const projectIds = projects.map(p => p._id);

    // Find all pending tasks for these projects
    const tasks = await Task.find({ 
      projectId: { $in: projectIds },
      status: 'pending',
      dueDate: { $gte: now }
    });

    // Filter tasks by window
    const notifications = [];
    tasks.forEach(task => {
      const diff = new Date(task.dueDate) - now;
      windows.forEach(w => {
        if (diff > 0 && diff <= w.ms + 5 * 60 * 1000 && diff > w.ms - 5 * 60 * 1000) {
          notifications.push({
            ...task.toObject(),
            window: w.label
          });
        }
      });
    });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 