const express = require('express');
const bcrypt = require('bcryptjs');
const { uuidv4 } = require('../utils/uuid');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all users (filtered by role and restaurant)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query, params;

    if (req.user.role === 'super_admin') {
      // Super admin can see all users except other super admins
      query = `
        SELECT u.*, r.name as restaurant_name 
        FROM users u 
        LEFT JOIN restaurants r ON u.restaurant_id = r.id 
        WHERE u.role != 'super_admin' 
        ORDER BY u.created_at DESC
      `;
      params = [];
    } else if (req.user.role === 'admin') {
      // Admin can see users in their restaurant
      query = `
        SELECT u.*, r.name as restaurant_name 
        FROM users u 
        LEFT JOIN restaurants r ON u.restaurant_id = r.id 
        WHERE u.restaurant_id = ? AND u.role != 'super_admin' 
        ORDER BY u.created_at DESC
      `;
      params = [req.user.restaurantId];
    } else {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const [users] = await pool.execute(query, params);
    
    // Remove passwords from response
    const sanitizedUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        restaurantId: user.restaurant_id,
        restaurantName: user.restaurant_name
      };
    });

    res.json(sanitizedUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, email, role, password, active = true, restaurantId } = req.body;

    // Validate required fields
    if (!name || !email || !role || !password) {
      return res.status(400).json({ error: 'Name, email, role, and password are required' });
    }

    // Check permissions
    if (req.user.role === 'admin' && ['super_admin', 'admin'].includes(role)) {
      return res.status(403).json({ error: 'Cannot create users with admin or super admin roles' });
    }

    if (req.user.role !== 'super_admin' && role === 'super_admin') {
      return res.status(403).json({ error: 'Cannot create super admin users' });
    }

    // Set restaurant ID based on user role
    let finalRestaurantId = restaurantId;
    if (req.user.role === 'admin' && !restaurantId) {
      finalRestaurantId = req.user.restaurantId;
    }

    if (role !== 'super_admin' && !finalRestaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required for non-super admin users' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await pool.execute(
      `INSERT INTO users (id, name, email, password, role, active, restaurant_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, email, hashedPassword, role, active, role === 'super_admin' ? null : finalRestaurantId]
    );

    // Get the created user
    const [newUser] = await pool.execute(
      `SELECT u.*, r.name as restaurant_name 
       FROM users u 
       LEFT JOIN restaurants r ON u.restaurant_id = r.id 
       WHERE u.id = ?`,
      [userId]
    );

    const { password: _, ...userWithoutPassword } = newUser[0];
    res.status(201).json({
      ...userWithoutPassword,
      restaurantId: newUser[0].restaurant_id,
      restaurantName: newUser[0].restaurant_name
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'User with this email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update user
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, password, active, restaurantId } = req.body;

    // Check if user exists and get current data
    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingUser = existingUsers[0];

    // Check permissions
    if (req.user.role === 'admin' && existingUser.restaurant_id !== req.user.restaurantId) {
      return res.status(403).json({ error: 'Cannot modify users from other restaurants' });
    }

    if (req.user.role === 'admin' && ['super_admin', 'admin'].includes(role)) {
      return res.status(403).json({ error: 'Cannot assign admin or super admin roles' });
    }

    // Prepare update data
    let updateQuery = 'UPDATE users SET name = ?, email = ?, role = ?, active = ?';
    let updateParams = [name, email, role, active];

    // Add password if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ', password = ?';
      updateParams.push(hashedPassword);
    }

    // Add restaurant ID if not super admin
    if (role !== 'super_admin') {
      updateQuery += ', restaurant_id = ?';
      updateParams.push(restaurantId || req.user.restaurantId);
    } else {
      updateQuery += ', restaurant_id = NULL';
    }

    updateQuery += ', updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    updateParams.push(id);

    await pool.execute(updateQuery, updateParams);

    // Get updated user
    const [updatedUser] = await pool.execute(
      `SELECT u.*, r.name as restaurant_name 
       FROM users u 
       LEFT JOIN restaurants r ON u.restaurant_id = r.id 
       WHERE u.id = ?`,
      [id]
    );

    const { password: _, ...userWithoutPassword } = updatedUser[0];
    res.json({
      ...userWithoutPassword,
      restaurantId: updatedUser[0].restaurant_id,
      restaurantName: updatedUser[0].restaurant_name
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingUser = existingUsers[0];

    // Check permissions
    if (req.user.role === 'admin' && existingUser.restaurant_id !== req.user.restaurantId) {
      return res.status(403).json({ error: 'Cannot delete users from other restaurants' });
    }

    if (existingUser.role === 'super_admin') {
      return res.status(403).json({ error: 'Cannot delete super admin users' });
    }

    // Prevent self-deletion
    if (id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const [result] = await pool.execute(
      'DELETE FROM users WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;