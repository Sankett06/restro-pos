const express = require('express');
const { uuidv4 } = require('../utils/uuid');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all staff for restaurant
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [staff] = await pool.execute(
      'SELECT * FROM staff WHERE restaurant_id = ? ORDER BY created_at DESC',
      [req.user.restaurantId]
    );

    res.json(staff.map(member => ({
      ...member,
      restaurantId: member.restaurant_id,
      hireDate: member.hire_date
    })));
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new staff member
router.post('/', authenticateToken, requireRole(['super_admin', 'admin', 'manager']), async (req, res) => {
  try {
    const { name, email, phone, role, salary, active = true, hireDate } = req.body;

    if (!name || !email || !phone || !role || !salary) {
      return res.status(400).json({ error: 'Name, email, phone, role, and salary are required' });
    }

    const staffId = uuidv4();
    const finalHireDate = hireDate || new Date().toISOString().split('T')[0];

    await pool.execute(
      `INSERT INTO staff (id, name, email, phone, role, salary, active, hire_date, restaurant_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [staffId, name, email, phone, role, salary, active, finalHireDate, req.user.restaurantId]
    );

    const [newStaff] = await pool.execute(
      'SELECT * FROM staff WHERE id = ?',
      [staffId]
    );

    res.status(201).json({
      ...newStaff[0],
      restaurantId: newStaff[0].restaurant_id,
      hireDate: newStaff[0].hire_date
    });
  } catch (error) {
    console.error('Create staff error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Staff member with this email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update staff member
router.put('/:id', authenticateToken, requireRole(['super_admin', 'admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, salary, active, hireDate } = req.body;

    if (!name || !email || !phone || !role || !salary) {
      return res.status(400).json({ error: 'Name, email, phone, role, and salary are required' });
    }

    await pool.execute(
      `UPDATE staff 
       SET name = ?, email = ?, phone = ?, role = ?, salary = ?, active = ?, hire_date = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND restaurant_id = ?`,
      [name, email, phone, role, salary, active, hireDate, id, req.user.restaurantId]
    );

    const [updatedStaff] = await pool.execute(
      'SELECT * FROM staff WHERE id = ? AND restaurant_id = ?',
      [id, req.user.restaurantId]
    );

    if (updatedStaff.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json({
      ...updatedStaff[0],
      restaurantId: updatedStaff[0].restaurant_id,
      hireDate: updatedStaff[0].hire_date
    });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete staff member
router.delete('/:id', authenticateToken, requireRole(['super_admin', 'admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM staff WHERE id = ? AND restaurant_id = ?',
      [id, req.user.restaurantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;