const mongoose = require('mongoose');

const wireframeGenerationSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  prompt: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WireframeGeneration', wireframeGenerationSchema); 