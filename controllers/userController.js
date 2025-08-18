const User = require('../models/User');

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { username, email, role, contact, bio } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if username or email is already taken
    if (username !== user.username || email !== user.email) {
      const exists = await User.findOne({
        $or: [
          { username, _id: { $ne: user._id } },
          { email, _id: { $ne: user._id } }
        ]
      });
      if (exists) {
        return res.status(400).json({ message: 'Username or email already taken' });
      }
    }

    user.username = username || user.username;
    user.email = email || user.email;
    user.role = role || user.role;
    user.contact = contact || user.contact;
    user.bio = bio || user.bio;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      contact: updatedUser.contact,
      bio: updatedUser.bio,
      profileImage: updatedUser.profileImage
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update profile image
// @route   PUT /api/users/profile/image
// @access  Private
const updateProfileImage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const imageUrl = req.body.imageUrl; // Only use the URL from the frontend
    if (!imageUrl) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    user.profileImage = imageUrl;
    await user.save();

    res.json({ profileImage: user.profileImage });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update password
// @route   PUT /api/users/password
// @access  Private
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllUsers,
  updateProfile,
  updateProfileImage,
  updatePassword
}; 