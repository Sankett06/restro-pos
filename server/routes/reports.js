const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get sales reports
router.get('/sales', authenticateToken, requireRole(['super_admin', 'admin', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate, period = 'today' } = req.query;
    
    let dateCondition = '';
    let params = [req.user.restaurantId];

    if (startDate && endDate) {
      dateCondition = 'AND DATE(o.created_at) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else {
      switch (period) {
        case 'today':
          dateCondition = 'AND DATE(o.created_at) = CURDATE()';
          break;
        case 'week':
          dateCondition = 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
          break;
        case 'month':
          dateCondition = 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
          break;
      }
    }

    // Total sales
    const [salesData] = await pool.execute(
      `SELECT 
         COUNT(*) as total_orders,
         SUM(total) as total_revenue,
         AVG(total) as average_order_value,
         SUM(CASE WHEN type = 'dine-in' THEN 1 ELSE 0 END) as dine_in_orders,
         SUM(CASE WHEN type = 'takeaway' THEN 1 ELSE 0 END) as takeaway_orders,
         SUM(CASE WHEN type = 'delivery' THEN 1 ELSE 0 END) as delivery_orders
       FROM orders o 
       WHERE o.restaurant_id = ? AND o.status != 'cancelled' ${dateCondition}`,
      params
    );

    // Top selling items
    const [topItems] = await pool.execute(
      `SELECT 
         mi.name,
         mi.category,
         SUM(oi.quantity) as total_quantity,
         SUM(oi.quantity * oi.price) as total_revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE o.restaurant_id = ? AND o.status != 'cancelled' ${dateCondition}
       GROUP BY mi.id, mi.name, mi.category
       ORDER BY total_quantity DESC
       LIMIT 10`,
      params
    );

    // Staff performance
    const [staffPerformance] = await pool.execute(
      `SELECT 
         u.name as staff_name,
         COUNT(o.id) as orders_handled,
         SUM(o.total) as revenue_generated
       FROM orders o
       JOIN users u ON o.staff_id = u.id
       WHERE o.restaurant_id = ? AND o.status != 'cancelled' ${dateCondition}
       GROUP BY u.id, u.name
       ORDER BY revenue_generated DESC`,
      params
    );

    // Daily sales trend
    const [dailySales] = await pool.execute(
      `SELECT 
         DATE(created_at) as date,
         COUNT(*) as orders,
         SUM(total) as revenue
       FROM orders 
       WHERE restaurant_id = ? AND status != 'cancelled' ${dateCondition}
       GROUP BY DATE(created_at)
       ORDER BY date DESC
       LIMIT 30`,
      params
    );

    res.json({
      summary: salesData[0],
      topItems,
      staffPerformance,
      dailySales
    });
  } catch (error) {
    console.error('Get sales reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get inventory reports
router.get('/inventory', authenticateToken, requireRole(['super_admin', 'admin', 'manager']), async (req, res) => {
  try {
    // Low stock items
    const [lowStockItems] = await pool.execute(
      `SELECT name, category, stock, price
       FROM menu_items 
       WHERE restaurant_id = ? AND stock < 10 AND available = true
       ORDER BY stock ASC`,
      [req.user.restaurantId]
    );

    // Category-wise inventory
    const [categoryInventory] = await pool.execute(
      `SELECT 
         category,
         COUNT(*) as total_items,
         SUM(stock) as total_stock,
         SUM(stock * price) as inventory_value
       FROM menu_items 
       WHERE restaurant_id = ? AND available = true
       GROUP BY category
       ORDER BY inventory_value DESC`,
      [req.user.restaurantId]
    );

    // Most consumed items (last 30 days)
    const [consumedItems] = await pool.execute(
      `SELECT 
         mi.name,
         mi.category,
         mi.stock as current_stock,
         SUM(oi.quantity) as consumed_quantity
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE o.restaurant_id = ? AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY mi.id, mi.name, mi.category, mi.stock
       ORDER BY consumed_quantity DESC
       LIMIT 20`,
      [req.user.restaurantId]
    );

    res.json({
      lowStockItems,
      categoryInventory,
      consumedItems
    });
  } catch (error) {
    console.error('Get inventory reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customer reports
router.get('/customers', authenticateToken, requireRole(['super_admin', 'admin', 'manager']), async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateCondition = '';
    switch (period) {
      case 'today':
        dateCondition = 'AND DATE(created_at) = CURDATE()';
        break;
      case 'week':
        dateCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        break;
      case 'month':
        dateCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        break;
    }

    // Customer statistics
    const [customerStats] = await pool.execute(
      `SELECT 
         COUNT(DISTINCT customer_phone) as unique_customers,
         COUNT(*) as total_orders,
         AVG(total) as average_spend
       FROM orders 
       WHERE restaurant_id = ? AND customer_phone IS NOT NULL AND status != 'cancelled' ${dateCondition}`,
      [req.user.restaurantId]
    );

    // Top customers
    const [topCustomers] = await pool.execute(
      `SELECT 
         customer_name,
         customer_phone,
         COUNT(*) as order_count,
         SUM(total) as total_spent,
         AVG(total) as average_order_value
       FROM orders 
       WHERE restaurant_id = ? AND customer_phone IS NOT NULL AND status != 'cancelled' ${dateCondition}
       GROUP BY customer_phone, customer_name
       ORDER BY total_spent DESC
       LIMIT 20`,
      [req.user.restaurantId]
    );

    // Order type distribution
    const [orderTypes] = await pool.execute(
      `SELECT 
         type,
         COUNT(*) as count,
         SUM(total) as revenue
       FROM orders 
       WHERE restaurant_id = ? AND status != 'cancelled' ${dateCondition}
       GROUP BY type`,
      [req.user.restaurantId]
    );

    res.json({
      customerStats: customerStats[0],
      topCustomers,
      orderTypes
    });
  } catch (error) {
    console.error('Get customer reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get table utilization reports
router.get('/tables', authenticateToken, requireRole(['super_admin', 'admin', 'manager']), async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateCondition = '';
    switch (period) {
      case 'today':
        dateCondition = 'AND DATE(o.created_at) = CURDATE()';
        break;
      case 'week':
        dateCondition = 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        break;
      case 'month':
        dateCondition = 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        break;
    }

    // Table utilization
    const [tableUtilization] = await pool.execute(
      `SELECT 
         t.number as table_number,
         t.capacity,
         t.location,
         COUNT(o.id) as orders_served,
         SUM(o.total) as revenue_generated,
         AVG(o.total) as average_order_value
       FROM tables t
       LEFT JOIN orders o ON t.id = o.table_id AND o.status != 'cancelled' ${dateCondition}
       WHERE t.restaurant_id = ?
       GROUP BY t.id, t.number, t.capacity, t.location
       ORDER BY revenue_generated DESC`,
      [req.user.restaurantId]
    );

    // Current table status
    const [currentStatus] = await pool.execute(
      `SELECT 
         status,
         COUNT(*) as count
       FROM tables 
       WHERE restaurant_id = ?
       GROUP BY status`,
      [req.user.restaurantId]
    );

    res.json({
      tableUtilization,
      currentStatus
    });
  } catch (error) {
    console.error('Get table reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;