const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err);
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Session expired. Please login again.' });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token. Please login again.' });
      } else {
        return res.status(401).json({ error: 'Authentication failed. Please login again.' });
      }
    }
    req.user = user;
    next();
  });
};

// Check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Check if user has access to restaurant
const checkRestaurantAccess = async (req, res, next) => {
  try {
    const restaurantId = req.params.restaurantId || req.body.restaurantId;
    
    // Super admin has access to all restaurants
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Check if user belongs to the restaurant
    if (req.user.restaurantId !== restaurantId) {
      return res.status(403).json({ error: 'Access denied to this restaurant' });
    }

    next();
  } catch (error) {
    console.error('Restaurant access check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  checkRestaurantAccess
};