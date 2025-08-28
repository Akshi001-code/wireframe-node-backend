const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// Get all notifications for a user
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      userId: req.user._id,
      isRead: false 
    })
    .populate('taskId', 'title dueDate status')
    .populate('projectId', 'name')
    .sort({ createdAt: -1 })
    .limit(20);

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get approaching deadlines (legacy endpoint for backward compatibility)
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

// Mark notification as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Mark all notifications as read
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get notification count
router.get('/count', protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      userId: req.user._id, 
      isRead: false 
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Test endpoint to manually trigger deadline check
router.post('/test-deadline-check', protect, async (req, res) => {
  try {
    console.log('[TEST] Manual deadline check triggered by user:', req.user._id);
    
    const now = new Date();
    const passedTasks = await require('../models/Task').find({ 
      status: 'pending', 
      dueDate: { $lt: now } 
    }).populate({
      path: 'projectId',
      select: 'userId'
    });
    
    console.log('[TEST] Found', passedTasks.length, 'passed deadline tasks');
    
    let notificationsCreated = 0;
    for (const task of passedTasks) {
      if (task.projectId && task.projectId.userId) {
        const existingNotification = await Notification.findOne({
          taskId: task._id,
          type: 'deadline_passed',
          createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
        });

        if (!existingNotification) {
          await Notification.create({
            userId: task.projectId.userId,
            taskId: task._id,
            projectId: task.projectId._id,
            type: 'deadline_passed',
            title: 'Deadline Passed',
            message: `Task "${task.title}" has passed its deadline`
          });
          notificationsCreated++;
        }
      }
    }
    
    res.json({ 
      message: 'Deadline check completed',
      passedTasksFound: passedTasks.length,
      notificationsCreated: notificationsCreated
    });
  } catch (err) {
    console.error('[TEST] Error in manual deadline check:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 