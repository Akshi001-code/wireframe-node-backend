const mongoose = require('mongoose');

const designSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Design', designSchema); 