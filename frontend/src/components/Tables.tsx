import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Grid3x3, Users, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/api';
import { Table as TableType } from '../types';

export default function Tables() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState<TableType | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    number: 0,
    capacity: 2,
    location: '',
    status: 'available' as TableType['status'],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingTable) {
        const updatedTable = await apiService.updateTable(editingTable.id, formData);
        dispatch({
          type: 'UPDATE_TABLE',
          payload: updatedTable,
        });
      } else {
        const newTable = await apiService.createTable(formData);
        dispatch({
          type: 'ADD_TABLE',
          payload: newTable,
        });
      }
      resetForm();
    } catch (error: any) {
      alert('Failed to save table: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingTable(null);
    setFormData({
      number: 0,
      capacity: 2,
      location: '',
      status: 'available',
    });
  };

  const handleEdit = (table: TableType) => {
    setEditingTable(table);
    setFormData({
      number: table.number,
      capacity: table.capacity,
      location: table.location,
      status: table.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this table?')) {
      try {
        await apiService.deleteTable(id);
        dispatch({ type: 'DELETE_TABLE', payload: id });
      } catch (error: any) {
        alert('Failed to delete table: ' + error.message);
      }
    }
  };

  const handleStatusChange = async (tableId: string, newStatus: TableType['status']) => {
    const table = state.tables.find(t => t.id === tableId);
    if (table) {
      try {
        const updatedTable = {
          ...table,
          status: newStatus,
          currentOrderId: newStatus === 'available' ? undefined : table.currentOrderId,
        };
        await apiService.updateTable(tableId, updatedTable);
        dispatch({
          type: 'UPDATE_TABLE',
          payload: updatedTable,
        });
      } catch (error: any) {
        alert('Failed to update table status: ' + error.message);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'occupied': return 'bg-red-100 text-red-800 border-red-200';
      case 'reserved': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const availableTables = state.tables.filter(t => t.status === 'available').length;
  const occupiedTables = state.tables.filter(t => t.status === 'occupied').length;
  const reservedTables = state.tables.filter(t => t.status === 'reserved').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Table Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Table</span>
        </button>
      </div>

      {/* Table Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tables</p>
              <p className="text-2xl font-bold text-gray-900">{state.tables.length}</p>
            </div>
            <Grid3x3 className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold text-green-600">{availableTables}</p>
            </div>
            <Grid3x3 className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Occupied</p>
              <p className="text-2xl font-bold text-red-600">{occupiedTables}</p>
            </div>
            <Grid3x3 className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reserved</p>
              <p className="text-2xl font-bold text-yellow-600">{reservedTables}</p>
            </div>
            <Grid3x3 className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Table Grid View */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Table Layout</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {state.tables.map((table) => (
            <div
              key={table.id}
              className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${getStatusColor(table.status)}`}
            >
              <div className="text-center">
                <Grid3x3 className="h-8 w-8 mx-auto mb-2" />
                <p className="font-bold text-lg">Table {table.number}</p>
                <p className="text-sm flex items-center justify-center mt-1">
                  <Users className="h-3 w-3 mr-1" />
                  {table.capacity}
                </p>
                <p className="text-xs mt-1 flex items-center justify-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {table.location}
                </p>
                <div className="mt-3 space-y-1">
                  <select
                    value={table.status}
                    onChange={(e) => handleStatusChange(table.id, e.target.value as TableType['status'])}
                    className="w-full text-xs px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                  </select>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEdit(table)}
                      className="flex-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(table.id)}
                      className="flex-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Order
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.tables.map((table) => {
                const currentOrder = table.currentOrderId ? 
                  state.orders.find(o => o.id === table.currentOrderId) : null;
                
                return (
                  <tr key={table.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Grid3x3 className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-sm font-medium text-gray-900">
                          Table {table.number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-1" />
                        {table.capacity} seats
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-1" />
                        {table.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        table.status === 'available' ? 'bg-green-100 text-green-800' :
                        table.status === 'occupied' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {table.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {currentOrder ? currentOrder.orderNumber : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(table)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(table.id)}
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

      {/* Add/Edit Table Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingTable ? 'Edit Table' : 'Add New Table'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Table Number</label>
                <input
                  type="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  placeholder="e.g., Main Hall, Terrace, Private Room"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as TableType['status'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="reserved">Reserved</option>
                </select>
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
                  {loading ? 'Saving...' : editingTable ? 'Update' : 'Add'} Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}