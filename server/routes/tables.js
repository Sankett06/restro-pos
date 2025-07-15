const express = require('express');
const { uuidv4 } = require('../utils/uuid');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all tables for restaurant
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [tables] = await pool.execute(
      `SELECT t.*, o.order_number as current_order_number
       FROM tables t
       LEFT JOIN orders o ON t.current_order_id = o.id
       WHERE t.restaurant_id = ? 
       ORDER BY t.number ASC`,
      [req.user.restaurantId]
    );

    res.json(tables.map(table => ({
      ...table,
      restaurantId: table.restaurant_id,
      currentOrderId: table.current_order_id,
      currentOrderNumber: table.current_order_number
    })));
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new table
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { number, capacity, location, status = 'available' } = req.body;

    if (!number || !capacity || !location) {
      return res.status(400).json({ error: 'Number, capacity, and location are required' });
    }

    const tableId = uuidv4();

    await pool.execute(
      `INSERT INTO tables (id, number, capacity, status, location, restaurant_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tableId, number, capacity, status, location, req.user.restaurantId]
    );

    const [newTable] = await pool.execute(
      'SELECT * FROM tables WHERE id = ?',
      [tableId]
    );

    res.status(201).json({
      ...newTable[0],
      restaurantId: newTable[0].restaurant_id,
      currentOrderId: newTable[0].current_order_id
    });
  } catch (error) {
    console.error('Create table error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Table number already exists in this restaurant' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update table
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { number, capacity, location, status, currentOrderId } = req.body;

    if (!number || !capacity || !location || !status) {
      return res.status(400).json({ error: 'Number, capacity, location, and status are required' });
    }

    await pool.execute(
      `UPDATE tables 
       SET number = ?, capacity = ?, location = ?, status = ?, current_order_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND restaurant_id = ?`,
      [number, capacity, location, status, currentOrderId || null, id, req.user.restaurantId]
    );

    const [updatedTable] = await pool.execute(
      'SELECT * FROM tables WHERE id = ? AND restaurant_id = ?',
      [id, req.user.restaurantId]
    );

    if (updatedTable.length === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }

    res.json({
      ...updatedTable[0],
      restaurantId: updatedTable[0].restaurant_id,
      currentOrderId: updatedTable[0].current_order_id
    });
  } catch (error) {
    console.error('Update table error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete table
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if table has active orders
    const [activeOrders] = await pool.execute(
      'SELECT id FROM orders WHERE table_id = ? AND status NOT IN ("served", "cancelled")',
      [id]
    );

    if (activeOrders.length > 0) {
      return res.status(400).json({ error: 'Cannot delete table with active orders' });
    }

    const [result] = await pool.execute(
      'DELETE FROM tables WHERE id = ? AND restaurant_id = ?',
      [id, req.user.restaurantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }

    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;