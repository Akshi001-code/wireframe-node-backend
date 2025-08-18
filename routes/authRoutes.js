const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const verify = require('../middleware/verifyToken');

router.post('/register', auth.register);
router.post('/login', auth.login);
router.get('/me', verify, auth.getUser);
router.put('/me', verify, auth.updateUser);
router.delete('/me', verify, auth.deleteUser);

module.exports = router;
