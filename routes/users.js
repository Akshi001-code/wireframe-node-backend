const express = require('express');
const router = express.Router();
const { 
  getAllUsers,
  updateProfile, 
  updateProfileImage, 
  updatePassword 
} = require('../controllers/userController');
const { protect, isAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.get('/', protect, isAdmin, getAllUsers);
router.put('/profile', protect, updateProfile);
router.put('/profile/image', protect, upload.single('image'), updateProfileImage);
router.put('/password', protect, updatePassword);

module.exports = router; 