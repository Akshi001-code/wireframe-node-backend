const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
  return jwt.sign({ id }, secret, {
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

    // Hardcoded admin login
    if (email === 'adimn@gmail.com' && password === 'admin') {
      // Try to find or create an admin user in the database for consistency
      let adminUser = await User.findOne({ email: 'adimn@gmail.com' });
      if (!adminUser) {
        try {
          adminUser = await User.create({
            email: 'adimn@gmail.com',
            username: 'admin',
            password: 'admin',
            role: 'admin',
          });
        } catch (err) {
          // Handle duplicate username by retrying with a unique one
          if (err && err.code === 11000 && err.keyPattern && err.keyPattern.username) {
            const uniqueUsername = 'admin_' + Math.random().toString(36).slice(-6);
            adminUser = await User.create({
              email: 'adimn@gmail.com',
              username: uniqueUsername,
              password: 'admin',
              role: 'admin',
            });
          } else {
            throw err;
          }
        }
      } else if (adminUser.role !== 'admin') {
        adminUser.role = 'admin';
        await adminUser.save();
      }

      return res.json({
        _id: adminUser._id,
        email: adminUser.email,
        username: adminUser.username,
        role: adminUser.role,
        contact: adminUser.contact,
        profileImage: adminUser.profileImage,
        token: generateToken(adminUser._id),
      });
    }

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
