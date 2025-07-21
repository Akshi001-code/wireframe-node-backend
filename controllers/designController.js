const Design = require('../models/Design');
const Project = require('../models/Project');

// @desc    Get all designs for a project
// @route   GET /api/designs/project/:projectId
// @access  Private
const getDesigns = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.projectId,
      userId: req.user._id
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const designs = await Design.find({ projectId: req.params.projectId });
    res.json(designs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add a new design
// @route   POST /api/designs/project/:projectId
// @access  Private
const addDesign = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.projectId,
      userId: req.user._id
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!req.body.imageUrl) {
      return res.status(400).json({ message: 'No imageUrl provided' });
    }

    const design = await Design.create({
      projectId: req.params.projectId,
      imageUrl: req.body.imageUrl,
      title: req.body.title,
      description: req.body.description
    });

    // Update project stats
    project.stats.designs += 1;
    project.lastUpdate = Date.now();
    await project.save();

    res.status(201).json(design);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a design
// @route   DELETE /api/designs/:id
// @access  Private
const deleteDesign = async (req, res) => {
  try {
    const design = await Design.findById(req.params.id);
    if (!design) {
      return res.status(404).json({ message: 'Design not found' });
    }

    // Verify project ownership
    const project = await Project.findOne({
      _id: design.projectId,
      userId: req.user._id
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // await design.remove();
    await Design.findByIdAndDelete(req.params.id);

    // Update project stats defensively
    if (typeof project.stats.designs === 'number' && project.stats.designs > 0) {
      project.stats.designs -= 1;
    } else {
      project.stats.designs = 0;
    }
    project.lastUpdate = Date.now();
    await project.save();

    res.json({ message: 'Design removed' });
  } catch (error) {
    console.error('Error in deleteDesign:', error.stack || error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a design
// @route   PUT /api/designs/:id
// @access  Private
const updateDesign = async (req, res) => {
  try {
    const design = await Design.findById(req.params.id);
    if (!design) {
      return res.status(404).json({ message: 'Design not found' });
    }
    // Verify project ownership
    const project = await Project.findOne({
      _id: design.projectId,
      userId: req.user._id
    });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    // Update fields
    if (req.body.title) design.title = req.body.title;
    if (req.body.description) design.description = req.body.description;
    await design.save();
    res.json(design);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getDesigns,
  addDesign,
  deleteDesign,
  updateDesign
}; 