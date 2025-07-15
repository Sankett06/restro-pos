import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Calendar, Clock, Users, Phone, Mail } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/api';
import { Reservation as ReservationType } from '../types';
import { format } from 'date-fns';
import { parseDateTime, isValidDate, formatDate } from '../utils/dateUtils';

export default function Reservations() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingReservation, setEditingReservation] = useState<ReservationType | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    email: '',
    tableId: '',
    date: '',
    time: '',
    partySize: 2,
    status: 'pending' as ReservationType['status'],
    specialRequests: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const reservationData = {
        ...formData,
        date: formData.date,
      };

      if (editingReservation) {
        const updatedReservation = await apiService.updateReservation(editingReservation.id, reservationData);
        dispatch({
          type: 'UPDATE_RESERVATION',
          payload: {
            ...updatedReservation,
            date: new Date(updatedReservation.date),
          },
        });
      } else {
        const newReservation = await apiService.createReservation(reservationData);
        dispatch({
          type: 'ADD_RESERVATION',
          payload: {
            ...newReservation,
            date: new Date(newReservation.date),
          },
        });
      }
      resetForm();
    } catch (error: any) {
      alert('Failed to save reservation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingReservation(null);
    setFormData({
      customerName: '',
      customerPhone: '',
      email: '',
      tableId: '',
      date: '',
      time: '',
      partySize: 2,
      status: 'pending',
      specialRequests: '',
    });
  };

  const handleEdit = (reservation: ReservationType) => {
    setEditingReservation(reservation);
    setFormData({
      customerName: reservation.customerName,
      customerPhone: reservation.customerPhone,
      email: reservation.email || '',
      tableId: reservation.tableId,
      date: isValidDate(reservation.date) ? format(parseDateTime(reservation.date), 'yyyy-MM-dd') : '',
      time: reservation.time,
      partySize: reservation.partySize,
      status: reservation.status,
      specialRequests: reservation.specialRequests || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this reservation?')) {
      try {
        await apiService.deleteReservation(id);
        dispatch({ type: 'DELETE_RESERVATION', payload: id });
      } catch (error: any) {
        alert('Failed to delete reservation: ' + error.message);
      }
    }
  };

  const handleStatusChange = async (reservationId: string, newStatus: ReservationType['status']) => {
    const reservation = state.reservations.find(r => r.id === reservationId);
    if (reservation) {
      try {
        const updatedReservation = await apiService.updateReservation(reservationId, {
          ...reservation,
          status: newStatus,
        });
        dispatch({
          type: 'UPDATE_RESERVATION',
          payload: updatedReservation,
        });
      } catch (error: any) {
        alert('Failed to update reservation status: ' + error.message);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const todayReservations = state.reservations.filter(r => 
    isValidDate(r.date) && format(parseDateTime(r.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  ).length;
  const pendingReservations = state.reservations.filter(r => r.status === 'pending').length;
  const confirmedReservations = state.reservations.filter(r => r.status === 'confirmed').length;
  const totalGuests = state.reservations
    .filter(r => r.status === 'confirmed')
    .reduce((sum, r) => sum + r.partySize, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Reservation</span>
        </button>
      </div>

      {/* Reservation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Reservations</p>
              <p className="text-2xl font-bold text-gray-900">{todayReservations}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingReservations}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-green-600">{confirmedReservations}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Guests</p>
              <p className="text-2xl font-bold text-emerald-600">{totalGuests}</p>
            </div>
            <Users className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Reservations List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Party Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Special Requests
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.reservations.map((reservation) => {
                const table = state.tables.find(t => t.id === reservation.tableId);
                return (
                  <tr key={reservation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {reservation.customerName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {reservation.customerPhone}
                        </div>
                        {reservation.email && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {reservation.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {isValidDate(reservation.date) ? format(parseDateTime(reservation.date), 'MMM dd, yyyy') : 'Invalid Date'}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {reservation.time}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Table {table?.number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Users className="h-4 w-4 mr-1" />
                        {reservation.partySize}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={reservation.status}
                        onChange={(e) => handleStatusChange(reservation.id, e.target.value as ReservationType['status'])}
                        className={`text-xs px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-emerald-500 ${getStatusColor(reservation.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {reservation.specialRequests || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(reservation)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(reservation.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Reservation Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingReservation ? 'Edit Reservation' : 'New Reservation'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Table</label>
                <select
                  value={formData.tableId}
                  onChange={(e) => setFormData({ ...formData, tableId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">Select a table</option>
                  {state.tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      Table {table.number} ({table.capacity} seats) - {table.location}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Party Size</label>
                <input
                  type="number"
                  value={formData.partySize}
                  onChange={(e) => setFormData({ ...formData, partySize: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ReservationType['status'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                <textarea
                  value={formData.specialRequests}
                  onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  placeholder="Any special requests or notes..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  {loading ? 'Saving...' : editingReservation ? 'Update' : 'Create'} Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}