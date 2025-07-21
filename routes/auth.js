const express = require('express');
const router = express.Router();
const { register, login, getMe, handleGoogleAuth } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/google', handleGoogleAuth);
router.get('/me', protect, getMe);

module.exports = router; 