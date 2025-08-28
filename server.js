// Import required packages
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/database');
const { errorHandler } = require('./middleware/error');
const path = require('path');
const nodeCron = require('node-cron');
const Task = require('./models/Task');
const Project = require('./models/Project');
const Notification = require('./models/Notification');
const notificationRoutes = require('./routes/notifications');

// Load environment variables
require('dotenv').config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const designRoutes = require('./routes/designs');
const wireframeRoutes = require('./routes/wireframe');
const htmlToImageRoute = require('./routes/htmlToImage');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/designs', designRoutes);
app.use('/api/wireframe', wireframeRoutes);
app.use('/api', htmlToImageRoute);
app.use('/api/notifications', notificationRoutes);

// Cron job: check for tasks with deadlines and passed deadlines (every 10 minutes)
nodeCron.schedule('*/10 * * * *', async () => { // every 10 minutes
  console.log('[CRON JOB] Starting deadline check at:', new Date().toISOString());
  const now = new Date();
  const windows = [
    { label: '1 day', ms: 24 * 60 * 60 * 1000 },
    { label: '12 hours', ms: 12 * 60 * 60 * 1000 },
    { label: '6 hours', ms: 6 * 60 * 60 * 1000 },
    { label: '3 hours', ms: 3 * 60 * 60 * 1000 },
    { label: '1 hour', ms: 1 * 60 * 60 * 1000 },
  ];
  
  try {
    // Check for approaching deadlines
    const approachingTasks = await Task.find({ status: 'pending', dueDate: { $gte: now } });
    console.log('[CRON JOB] Found', approachingTasks.length, 'approaching tasks');
    approachingTasks.forEach(task => {
      const diff = new Date(task.dueDate) - now;
      windows.forEach(w => {
        if (diff > 0 && diff <= w.ms + 5 * 60 * 1000 && diff > w.ms - 5 * 60 * 1000) {
          console.log(`[DEADLINE REMINDER] Task '${task.title}' is due in ${w.label} (at ${task.dueDate})`);
          // Create approaching deadline notification
          createApproachingDeadlineNotification(task, w.label);
        }
      });
    });

    // Check for passed deadlines (tasks that are overdue)
    const passedTasks = await Task.find({ 
      status: 'pending', 
      dueDate: { $lt: now } 
    }).populate({
      path: 'projectId',
      select: 'userId'
    });
    
    console.log('[CRON JOB] Found', passedTasks.length, 'passed deadline tasks');
    passedTasks.forEach(task => {
      console.log(`[DEADLINE PASSED] Task '${task.title}' has passed its deadline (was due: ${task.dueDate})`);
      console.log(`[DEADLINE PASSED] Task projectId:`, task.projectId);
      // Create passed deadline notification
      createPassedDeadlineNotification(task);
    });
    
    console.log('[CRON JOB] Deadline check completed at:', new Date().toISOString());
  } catch (err) {
    console.error('Error in deadline cron job:', err);
  }
});

// Additional cron job for testing (every 2 minutes)
nodeCron.schedule('*/2 * * * *', async () => { // every 2 minutes
  console.log('[CRON JOB TEST] Starting test deadline check at:', new Date().toISOString());
  const now = new Date();
  
  try {
    const passedTasks = await Task.find({ 
      status: 'pending', 
      dueDate: { $lt: now } 
    }).populate({
      path: 'projectId',
      select: 'userId'
    });
    
    console.log('[CRON JOB TEST] Found', passedTasks.length, 'passed deadline tasks');
    
    passedTasks.forEach(task => {
      console.log(`[CRON JOB TEST] Passed task: ${task.title}, Project: ${task.projectId?.name || 'Unknown'}`);
    });
  } catch (err) {
    console.error('[CRON JOB TEST] Error:', err);
  }
});

// Helper function to create approaching deadline notification
async function createApproachingDeadlineNotification(task, timeWindow) {
  try {
    // Populate projectId if not already populated
    if (!task.projectId.userId) {
      await task.populate('projectId', 'userId');
    }

    // Check if notification already exists for this task and time window
    const existingNotification = await Notification.findOne({
      taskId: task._id,
      type: 'deadline_approaching',
      createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // Within last 10 minutes
    });

    if (!existingNotification) {
      await Notification.create({
        userId: task.projectId.userId,
        taskId: task._id,
        projectId: task.projectId._id,
        type: 'deadline_approaching',
        title: 'Deadline Approaching',
        message: `Task "${task.title}" is due in ${timeWindow}`
      });
    }
  } catch (error) {
    console.error('Error creating approaching deadline notification:', error);
  }
}

// Helper function to create passed deadline notification
async function createPassedDeadlineNotification(task) {
  try {
    console.log('[NOTIFICATION] Creating passed deadline notification for task:', task.title);
    console.log('[NOTIFICATION] Task projectId:', task.projectId);
    
    // Populate projectId if not already populated
    if (!task.projectId.userId) {
      console.log('[NOTIFICATION] Populating projectId...');
      await task.populate('projectId', 'userId');
    }

    console.log('[NOTIFICATION] UserId from project:', task.projectId.userId);

    // Check if notification already exists for this passed deadline
    const existingNotification = await Notification.findOne({
      taskId: task._id,
      type: 'deadline_passed',
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Within last hour
    });

    console.log('[NOTIFICATION] Existing notification found:', !!existingNotification);

    if (!existingNotification) {
      const newNotification = await Notification.create({
        userId: task.projectId.userId,
        taskId: task._id,
        projectId: task.projectId._id,
        type: 'deadline_passed',
        title: 'Deadline Passed',
        message: `Task "${task.title}" has passed its deadline`
      });
      console.log('[NOTIFICATION] Created new notification:', newNotification._id);
    } else {
      console.log('[NOTIFICATION] Skipping - notification already exists');
    }
  } catch (error) {
    console.error('Error creating passed deadline notification:', error);
    console.error('Error details:', error.stack);
  }
}

// Error handling middleware
app.use(errorHandler);


// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
