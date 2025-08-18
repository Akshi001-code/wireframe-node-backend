const express = require('express');
const router = express.Router();
const { 
  updateProfile, 
  updateProfileImage, 
  updatePassword,
  getAllUsers,
  deleteUser
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.put('/profile', protect, updateProfile);
router.put('/profile/image', protect, upload.single('image'), updateProfileImage);
router.put('/password', protect, updatePassword);

// Admin-only route to list all users
router.get('/', protect, admin, getAllUsers);
// Admin-only route to delete a user
router.delete('/:id', protect, admin, deleteUser);

module.exports = router; 