const express = require('express');
const router = express.Router();
const {
  getDesigns,
  addDesign,
  deleteDesign,
  updateDesign
} = require('../controllers/designController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Get all designs for a project
router.get('/project/:projectId', protect, getDesigns);

// Add a new design
router.post('/project/:projectId', 
  protect, 
  addDesign
);

// Delete a design
router.delete('/:id', protect, deleteDesign);

// Update a design
router.put('/:id', protect, updateDesign);

// Test endpoint to get project stats
router.get('/project/:projectId/stats', protect, async (req, res) => {
  try {
    const project = await require('../models/Project').findOne({
      _id: req.params.projectId,
      userId: req.user._id
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const designs = await require('../models/Design').find({ projectId: req.params.projectId });
    
    res.json({
      projectStats: project.stats,
      actualDesignsCount: designs.length,
      projectId: req.params.projectId
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 