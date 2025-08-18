const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Handle Google OAuth
// @route   POST /api/auth/google
// @access  Public
const handleGoogleAuth = async (req, res) => {
  try {
    const { googleId, email, displayName, photoUrl } = req.body;

    // Find or create user
    let user = await User.findOne({ 
      $or: [
        { googleId },
        { email }
      ]
    });

    if (!user) {
      // Create new user
      const username = email.split('@')[0] + '_' + Math.random().toString(36).slice(-4);
      user = await User.create({
        email,
        username,
        googleId,
        googleEmail: email,
        googleDisplayName: displayName,
        googlePhotoUrl: photoUrl,
        profileImage: photoUrl,
      });
    } else if (!user.googleId) {
      // Existing email user - link Google account
      user.googleId = googleId;
      user.googleEmail = email;
      user.googleDisplayName = displayName;
      user.googlePhotoUrl = photoUrl;
      if (!user.profileImage && photoUrl) {
        user.profileImage = photoUrl;
      }
      await user.save();
    }

    res.json({
      _id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      contact: user.contact,
      profileImage: user.profileImage,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { email, username, password, role, contact } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      email,
      username,
      password,
      role,
      contact
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        contact: user.contact,
        profileImage: user.profileImage,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      _id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      contact: user.contact,
      profileImage: user.profileImage,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  handleGoogleAuth,
};
