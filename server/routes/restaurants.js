const express = require('express');
const { uuidv4 } = require('../utils/uuid');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all restaurants (super admin) or user's restaurants
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query, params;

    if (req.user.role === 'super_admin') {
      query = 'SELECT * FROM restaurants ORDER BY created_at DESC';
      params = [];
    } else {
      query = 'SELECT * FROM restaurants WHERE id = ? ORDER BY created_at DESC';
      params = [req.user.restaurantId];
    }

    const [restaurants] = await pool.execute(query, params);
    res.json(restaurants.map(restaurant => ({
      ...restaurant,
      ownerId: restaurant.owner_id,
      gstNumber: restaurant.gst_number,
      createdAt: restaurant.created_at,
      updatedAt: restaurant.updated_at
    })));
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get restaurant by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check access permissions
    if (req.user.role !== 'super_admin' && req.user.restaurantId !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [restaurants] = await pool.execute(
      'SELECT * FROM restaurants WHERE id = ?',
      [id]
    );

    if (restaurants.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.json({
      ...restaurants[0],
      ownerId: restaurants[0].owner_id,
      gstNumber: restaurants[0].gst_number,
      createdAt: restaurants[0].created_at,
      updatedAt: restaurants[0].updated_at
    });
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create restaurant (super admin only)
router.post('/', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  try {
    const { name, address, phone, email, gstNumber, currency, currencySymbol } = req.body;

    if (!name || !address || !phone || !email) {
      return res.status(400).json({ error: 'Name, address, phone, and email are required' });
    }

    const restaurantId = uuidv4();

    await pool.execute(
      `INSERT INTO restaurants (id, name, address, phone, email, gst_number, currency, currency_symbol, owner_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [restaurantId, name, address, phone, email, gstNumber || null, currency || 'USD', currencySymbol || '$', req.user.userId]
    );

    const [newRestaurant] = await pool.execute(
      'SELECT * FROM restaurants WHERE id = ?',
      [restaurantId]
    );

    res.status(201).json({
      ...newRestaurant[0],
      ownerId: newRestaurant[0].owner_id,
      gstNumber: newRestaurant[0].gst_number,
      createdAt: newRestaurant[0].created_at,
      updatedAt: newRestaurant[0].updated_at
    });
  } catch (error) {
    console.error('Create restaurant error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Restaurant with this email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update restaurant
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email, gstNumber, currency, currencySymbol, active } = req.body;

    // Check access permissions
    if (req.user.role !== 'super_admin' && req.user.restaurantId !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!name || !address || !phone || !email) {
      return res.status(400).json({ error: 'Name, address, phone, and email are required' });
    }

    await pool.execute(
      `UPDATE restaurants 
       SET name = ?, address = ?, phone = ?, email = ?, gst_number = ?, currency = ?, currency_symbol = ?, active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, address, phone, email, gstNumber || null, currency || 'USD', currencySymbol || '$', active !== undefined ? active : true, id]
    );

    const [updatedRestaurant] = await pool.execute(
      'SELECT * FROM restaurants WHERE id = ?',
      [id]
    );

    if (updatedRestaurant.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.json({
      ...updatedRestaurant[0],
      ownerId: updatedRestaurant[0].owner_id,
      gstNumber: updatedRestaurant[0].gst_number,
      createdAt: updatedRestaurant[0].created_at,
      updatedAt: updatedRestaurant[0].updated_at
    });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete restaurant (super admin only)
router.delete('/:id', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM restaurants WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;