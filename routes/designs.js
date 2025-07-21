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

module.exports = router; 