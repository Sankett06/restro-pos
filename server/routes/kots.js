const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all KOTs for restaurant
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = `
      SELECT k.*, o.order_number
      FROM kots k
      JOIN orders o ON k.order_id = o.id
      WHERE k.restaurant_id = ?
    `;
    const params = [req.user.restaurantId];

    if (status) {
      query += ' AND k.status = ?';
      params.push(status);
    }

    query += ' ORDER BY k.created_at ASC';

    const [kots] = await pool.execute(query, params);

    // Get KOT items for each KOT
    for (let kot of kots) {
      const [items] = await pool.execute(
        `SELECT ki.*, mi.name as menu_item_name, mi.category
         FROM kot_items ki
         JOIN menu_items mi ON ki.menu_item_id = mi.id
         WHERE ki.kot_id = ?`,
        [kot.id]
      );
      kot.items = items.map(item => ({
        ...item,
        menuItemId: item.menu_item_id,
        specialInstructions: item.special_instructions
      }));
    }

    res.json(kots.map(kot => ({
      ...kot,
      restaurantId: kot.restaurant_id,
      orderId: kot.order_id,
      orderNumber: kot.order_number,
      tableNumber: kot.table_number,
      specialInstructions: kot.special_instructions
    })));
  } catch (error) {
    console.error('Get KOTs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update KOT status
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['pending', 'preparing', 'ready'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Update KOT status
    await pool.execute(
      'UPDATE kots SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND restaurant_id = ?',
      [status, id, req.user.restaurantId]
    );

    // Update corresponding order status
    const [kot] = await pool.execute(
      'SELECT order_id FROM kots WHERE id = ? AND restaurant_id = ?',
      [id, req.user.restaurantId]
    );

    if (kot.length > 0) {
      let orderStatus = 'pending';
      if (status === 'preparing') orderStatus = 'preparing';
      if (status === 'ready') orderStatus = 'ready';

      await pool.execute(
        'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [orderStatus, kot[0].order_id]
      );
    }

    res.json({ message: 'KOT status updated successfully' });
  } catch (error) {
    console.error('Update KOT status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get KOT by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [kots] = await pool.execute(
      `SELECT k.*, o.order_number
       FROM kots k
       JOIN orders o ON k.order_id = o.id
       WHERE k.id = ? AND k.restaurant_id = ?`,
      [id, req.user.restaurantId]
    );

    if (kots.length === 0) {
      return res.status(404).json({ error: 'KOT not found' });
    }

    const kot = kots[0];

    // Get KOT items
    const [items] = await pool.execute(
      `SELECT ki.*, mi.name as menu_item_name, mi.category
       FROM kot_items ki
       JOIN menu_items mi ON ki.menu_item_id = mi.id
       WHERE ki.kot_id = ?`,
      [kot.id]
    );

    kot.items = items.map(item => ({
      ...item,
      menuItemId: item.menu_item_id,
      specialInstructions: item.special_instructions
    }));

    res.json({
      ...kot,
      restaurantId: kot.restaurant_id,
      orderId: kot.order_id,
      orderNumber: kot.order_number,
      tableNumber: kot.table_number,
      specialInstructions: kot.special_instructions
    });
  } catch (error) {
    console.error('Get KOT error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;