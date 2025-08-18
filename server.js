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
const authRoutes = require('./routes/authRoutes');
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

// Cron job: check for tasks with deadlines in 1d, 12h, 6h, 3h, 1h
nodeCron.schedule('*/10 * * * *', async () => { // every 10 minutes
  const now = new Date();
  const windows = [
    { label: '1 day', ms: 24 * 60 * 60 * 1000 },
    { label: '12 hours', ms: 12 * 60 * 60 * 1000 },
    { label: '6 hours', ms: 6 * 60 * 60 * 1000 },
    { label: '3 hours', ms: 3 * 60 * 60 * 1000 },
    { label: '1 hour', ms: 1 * 60 * 60 * 1000 },
  ];
  try {
    const tasks = await Task.find({ status: 'pending', dueDate: { $gte: now } });
    tasks.forEach(task => {
      const diff = new Date(task.dueDate) - now;
      windows.forEach(w => {
        if (diff > 0 && diff <= w.ms + 5 * 60 * 1000 && diff > w.ms - 5 * 60 * 1000) {
          console.log(`[DEADLINE REMINDER] Task '${task.title}' is due in ${w.label} (at ${task.dueDate})`);
          // Here you would trigger a notification (e.g., push, email, etc.)
        }
      });
    });
  } catch (err) {
    console.error('Error in deadline cron job:', err);
  }
});

// Error handling middleware
app.use(errorHandler);


// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
