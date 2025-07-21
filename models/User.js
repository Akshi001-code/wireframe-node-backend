const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function() { return !this.googleId; }, // Only required if not using Google auth
  },
  role: {
    type: String,
    required: true,
    default: 'user',
  },
  contact: {
    type: String,
  },
  profileImage: {
    type: String,
    default: '',
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  googleEmail: {
    type: String,
    sparse: true,
  },
  googleDisplayName: {
    type: String,
  },
  googlePhotoUrl: {
    type: String,
  }
}, {
  timestamps: true,
});

// Only hash password if it's being modified and exists
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 