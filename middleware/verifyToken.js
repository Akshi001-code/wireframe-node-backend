const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Compatibility wrapper for older routes expecting '../middleware/verifyToken'
module.exports = async function verifyToken(req, res, next) {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
      const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
      const decoded = jwt.verify(token, secret);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};


