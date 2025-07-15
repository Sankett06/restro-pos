const express = require('express');
const { uuidv4 } = require('../utils/uuid');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all menu items for restaurant
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, available } = req.query;
    
    let query = 'SELECT * FROM menu_items WHERE restaurant_id = ?';
    const params = [req.user.restaurantId];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (available !== undefined) {
      query += ' AND available = ?';
      params.push(available === 'true');
    }

    query += ' ORDER BY category, name';

    const [menuItems] = await pool.execute(query, params);

    res.json(menuItems.map(item => ({
      ...item,
      restaurantId: item.restaurant_id
    })));
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get menu categories
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT DISTINCT category FROM menu_items WHERE restaurant_id = ? ORDER BY category',
      [req.user.restaurantId]
    );

    res.json(categories.map(cat => cat.category));
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new menu item
router.post('/', authenticateToken, requireRole(['super_admin', 'admin', 'manager']), async (req, res) => {
  try {
    const { name, description, category, price, stock, available = true, image } = req.body;

    if (!name || !description || !category || !price || stock === undefined) {
      return res.status(400).json({ error: 'Name, description, category, price, and stock are required' });
    }

    const menuItemId = uuidv4();

    await pool.execute(
      `INSERT INTO menu_items (id, name, description, category, price, stock, available, image, restaurant_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [menuItemId, name, description, category, price, stock, available, image || null, req.user.restaurantId]
    );

    const [newMenuItem] = await pool.execute(
      'SELECT * FROM menu_items WHERE id = ?',
      [menuItemId]
    );

    res.status(201).json({
      ...newMenuItem[0],
      restaurantId: newMenuItem[0].restaurant_id
    });
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update menu item
router.put('/:id', authenticateToken, requireRole(['super_admin', 'admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, price, stock, available, image } = req.body;

    if (!name || !description || !category || !price || stock === undefined) {
      return res.status(400).json({ error: 'Name, description, category, price, and stock are required' });
    }

    await pool.execute(
      `UPDATE menu_items 
       SET name = ?, description = ?, category = ?, price = ?, stock = ?, available = ?, image = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND restaurant_id = ?`,
      [name, description, category, price, stock, available, image || null, id, req.user.restaurantId]
    );

    const [updatedMenuItem] = await pool.execute(
      'SELECT * FROM menu_items WHERE id = ? AND restaurant_id = ?',
      [id, req.user.restaurantId]
    );

    if (updatedMenuItem.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json({
      ...updatedMenuItem[0],
      restaurantId: updatedMenuItem[0].restaurant_id
    });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete menu item
router.delete('/:id', authenticateToken, requireRole(['super_admin', 'admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if menu item is used in any active orders
    const [activeOrderItems] = await pool.execute(
      `SELECT oi.id FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.menu_item_id = ? AND o.status NOT IN ('served', 'cancelled')`,
      [id]
    );

    if (activeOrderItems.length > 0) {
      return res.status(400).json({ error: 'Cannot delete menu item that is in active orders' });
    }

    const [result] = await pool.execute(
      'DELETE FROM menu_items WHERE id = ? AND restaurant_id = ?',
      [id, req.user.restaurantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;