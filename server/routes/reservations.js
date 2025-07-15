const express = require('express');
const { uuidv4 } = require('../utils/uuid');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all reservations for restaurant
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, date } = req.query;
    
    let query = `
      SELECT r.*, t.number as table_number, t.capacity as table_capacity
      FROM reservations r
      JOIN tables t ON r.table_id = t.id
      WHERE r.restaurant_id = ?
    `;
    const params = [req.user.restaurantId];

    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }

    if (date) {
      query += ' AND DATE(r.reservation_date) = ?';
      params.push(date);
    }

    query += ' ORDER BY r.reservation_date DESC, r.reservation_time DESC';

    const [reservations] = await pool.execute(query, params);

    res.json(reservations.map(reservation => ({
      ...reservation,
      restaurantId: reservation.restaurant_id,
      tableId: reservation.table_id,
      customerName: reservation.customer_name,
      customerPhone: reservation.customer_phone,
      date: reservation.reservation_date,
      time: reservation.reservation_time,
      partySize: reservation.party_size,
      specialRequests: reservation.special_requests,
      tableNumber: reservation.table_number,
      tableCapacity: reservation.table_capacity
    })));
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new reservation
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      customerName, 
      customerPhone, 
      email, 
      tableId, 
      date, 
      time, 
      partySize, 
      status = 'pending', 
      specialRequests 
    } = req.body;

    if (!customerName || !customerPhone || !tableId || !date || !time || !partySize) {
      return res.status(400).json({ 
        error: 'Customer name, phone, table, date, time, and party size are required' 
      });
    }

    // Check if table exists and belongs to restaurant
    const [tables] = await pool.execute(
      'SELECT id, capacity FROM tables WHERE id = ? AND restaurant_id = ?',
      [tableId, req.user.restaurantId]
    );

    if (tables.length === 0) {
      return res.status(400).json({ error: 'Invalid table selection' });
    }

    if (partySize > tables[0].capacity) {
      return res.status(400).json({ error: 'Party size exceeds table capacity' });
    }

    // Check for conflicting reservations
    const [conflicts] = await pool.execute(
      `SELECT id FROM reservations 
       WHERE table_id = ? AND reservation_date = ? AND reservation_time = ? 
       AND status IN ('pending', 'confirmed')`,
      [tableId, date, time]
    );

    if (conflicts.length > 0) {
      return res.status(400).json({ error: 'Table is already reserved for this time slot' });
    }

    const reservationId = uuidv4();

    await pool.execute(
      `INSERT INTO reservations (
        id, customer_name, customer_phone, email, table_id, reservation_date, 
        reservation_time, party_size, status, special_requests, restaurant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reservationId, customerName, customerPhone, email || null, tableId, 
        date, time, partySize, status, specialRequests || null, req.user.restaurantId
      ]
    );

    // Update table status if confirmed
    if (status === 'confirmed') {
      await pool.execute(
        'UPDATE tables SET status = ? WHERE id = ?',
        ['reserved', tableId]
      );
    }

    const [newReservation] = await pool.execute(
      `SELECT r.*, t.number as table_number, t.capacity as table_capacity
       FROM reservations r
       JOIN tables t ON r.table_id = t.id
       WHERE r.id = ?`,
      [reservationId]
    );

    res.status(201).json({
      ...newReservation[0],
      restaurantId: newReservation[0].restaurant_id,
      tableId: newReservation[0].table_id,
      customerName: newReservation[0].customer_name,
      customerPhone: newReservation[0].customer_phone,
      date: newReservation[0].reservation_date,
      time: newReservation[0].reservation_time,
      partySize: newReservation[0].party_size,
      specialRequests: newReservation[0].special_requests
    });
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update reservation
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      customerName, 
      customerPhone, 
      email, 
      tableId, 
      date, 
      time, 
      partySize, 
      status, 
      specialRequests 
    } = req.body;

    if (!customerName || !customerPhone || !tableId || !date || !time || !partySize || !status) {
      return res.status(400).json({ 
        error: 'Customer name, phone, table, date, time, party size, and status are required' 
      });
    }

    // Get current reservation
    const [currentReservation] = await pool.execute(
      'SELECT * FROM reservations WHERE id = ? AND restaurant_id = ?',
      [id, req.user.restaurantId]
    );

    if (currentReservation.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const oldTableId = currentReservation[0].table_id;
    const oldStatus = currentReservation[0].status;

    // Check table capacity
    const [tables] = await pool.execute(
      'SELECT capacity FROM tables WHERE id = ? AND restaurant_id = ?',
      [tableId, req.user.restaurantId]
    );

    if (tables.length === 0) {
      return res.status(400).json({ error: 'Invalid table selection' });
    }

    if (partySize > tables[0].capacity) {
      return res.status(400).json({ error: 'Party size exceeds table capacity' });
    }

    await pool.execute(
      `UPDATE reservations 
       SET customer_name = ?, customer_phone = ?, email = ?, table_id = ?, 
           reservation_date = ?, reservation_time = ?, party_size = ?, status = ?, 
           special_requests = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND restaurant_id = ?`,
      [
        customerName, customerPhone, email || null, tableId, date, time, 
        partySize, status, specialRequests || null, id, req.user.restaurantId
      ]
    );

    // Update table statuses
    if (oldStatus === 'confirmed' && oldTableId) {
      await pool.execute(
        'UPDATE tables SET status = ? WHERE id = ?',
        ['available', oldTableId]
      );
    }

    if (status === 'confirmed') {
      await pool.execute(
        'UPDATE tables SET status = ? WHERE id = ?',
        ['reserved', tableId]
      );
    }

    const [updatedReservation] = await pool.execute(
      `SELECT r.*, t.number as table_number, t.capacity as table_capacity
       FROM reservations r
       JOIN tables t ON r.table_id = t.id
       WHERE r.id = ?`,
      [id]
    );

    res.json({
      ...updatedReservation[0],
      restaurantId: updatedReservation[0].restaurant_id,
      tableId: updatedReservation[0].table_id,
      customerName: updatedReservation[0].customer_name,
      customerPhone: updatedReservation[0].customer_phone,
      date: updatedReservation[0].reservation_date,
      time: updatedReservation[0].reservation_time,
      partySize: updatedReservation[0].party_size,
      specialRequests: updatedReservation[0].special_requests
    });
  } catch (error) {
    console.error('Update reservation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete reservation
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get reservation details before deletion
    const [reservation] = await pool.execute(
      'SELECT table_id, status FROM reservations WHERE id = ? AND restaurant_id = ?',
      [id, req.user.restaurantId]
    );

    if (reservation.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Free up table if it was reserved
    if (reservation[0].status === 'confirmed') {
      await pool.execute(
        'UPDATE tables SET status = ? WHERE id = ?',
        ['available', reservation[0].table_id]
      );
    }

    const [result] = await pool.execute(
      'DELETE FROM reservations WHERE id = ? AND restaurant_id = ?',
      [id, req.user.restaurantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    res.json({ message: 'Reservation deleted successfully' });
  } catch (error) {
    console.error('Delete reservation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;