const express = require('express');
const { uuidv4 } = require('../utils/uuid');
const { pool } = require('../config/database');
const { authenticateToken, checkRestaurantAccess } = require('../middleware/auth');

const router = express.Router();

// Get all orders for restaurant
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, type, date } = req.query;
    let query = `
      SELECT o.*, 
             t.number as table_number,
             u.name as staff_name
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN users u ON o.staff_id = u.id
      WHERE o.restaurant_id = ?
    `;
    const params = [req.user.restaurantId];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    if (type) {
      query += ' AND o.type = ?';
      params.push(type);
    }

    if (date) {
      query += ' AND DATE(o.created_at) = ?';
      params.push(date);
    }

    query += ' ORDER BY o.created_at DESC';

    const [orders] = await pool.execute(query, params);

    // Get order items for each order
    for (let order of orders) {
      const [items] = await pool.execute(
        `SELECT oi.*, mi.name as menu_item_name, mi.category
         FROM order_items oi
         JOIN menu_items mi ON oi.menu_item_id = mi.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new order
router.post('/', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const {
      type,
      tableId,
      customerName,
      customerPhone,
      customerAddress,
      items,
      subtotal,
      tax,
      serviceCharge,
      discount = 0,
      total
    } = req.body;

    if (!type || !items || items.length === 0) {
      return res.status(400).json({ error: 'Order type and items are required' });
    }

    const orderId = uuidv4();
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    // Create order
    await connection.execute(
      `INSERT INTO orders (
        id, order_number, type, table_id, customer_name, customer_phone, 
        customer_address, subtotal, tax, service_charge, discount, total, 
        staff_id, restaurant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, orderNumber, type, tableId || null, customerName || null,
        customerPhone || null, customerAddress || null, subtotal, tax,
        serviceCharge, discount, total, req.user.userId, req.user.restaurantId
      ]
    );

    // Create order items
    for (const item of items) {
      const itemId = uuidv4();
      await connection.execute(
        `INSERT INTO order_items (id, order_id, menu_item_id, quantity, price, special_instructions)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [itemId, orderId, item.menuItemId, item.quantity, item.price, item.specialInstructions || null]
      );

      // Update menu item stock
      await connection.execute(
        'UPDATE menu_items SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.menuItemId]
      );
    }

    // Update table status if dine-in
    if (type === 'dine-in' && tableId) {
      await connection.execute(
        'UPDATE tables SET status = ?, current_order_id = ? WHERE id = ?',
        ['occupied', orderId, tableId]
      );
    }

    // Create KOT
    const kotId = uuidv4();
    const [tableResult] = await connection.execute(
      'SELECT number FROM tables WHERE id = ?',
      [tableId || '']
    );
    const tableNumber = tableResult.length > 0 ? tableResult[0].number : null;

    await connection.execute(
      `INSERT INTO kots (id, order_id, order_number, table_number, type, restaurant_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [kotId, orderId, orderNumber, tableNumber, type, req.user.restaurantId]
    );

    // Create KOT items
    for (const item of items) {
      const kotItemId = uuidv4();
      await connection.execute(
        `INSERT INTO kot_items (id, kot_id, menu_item_id, quantity, price, special_instructions)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [kotItemId, kotId, item.menuItemId, item.quantity, item.price, item.specialInstructions || null]
      );
    }

    await connection.commit();

    // Get the created order with items
    const [newOrder] = await connection.execute(
      `SELECT o.*, t.number as table_number, u.name as staff_name
       FROM orders o
       LEFT JOIN tables t ON o.table_id = t.id
       LEFT JOIN users u ON o.staff_id = u.id
       WHERE o.id = ?`,
      [orderId]
    );

    const [orderItems] = await connection.execute(
      `SELECT oi.*, mi.name as menu_item_name, mi.category
       FROM order_items oi
       JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    newOrder[0].items = orderItems;

    res.status(201).json(newOrder[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// Update order status
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['pending', 'preparing', 'ready', 'served', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Update order status
    await pool.execute(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND restaurant_id = ?',
      [status, id, req.user.restaurantId]
    );

    // If order is completed, free up the table
    if (['served', 'delivered', 'cancelled'].includes(status)) {
      await pool.execute(
        `UPDATE tables t 
         JOIN orders o ON t.current_order_id = o.id 
         SET t.status = 'available', t.current_order_id = NULL 
         WHERE o.id = ?`,
        [id]
      );
    }

    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;