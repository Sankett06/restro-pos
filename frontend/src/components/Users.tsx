import React, { useState } from 'react';
import { Plus, Edit2, Trash2, User, Building2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/api';
import { User as UserType } from '../types';
import { parseDateTime, isValidDate } from '../utils/dateUtils';

export default function Users() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'staff' as UserType['role'],
    password: '',
    active: true,
    restaurantId: '',
  });

  // Filter users based on current user's role and restaurant
  const getFilteredUsers = () => {
    if (state.currentUser?.role === 'super_admin') {
      return state.users.filter(u => u.role !== 'super_admin');
    } else if (state.currentUser?.role === 'admin') {
      return state.users.filter(u => 
        u.restaurantId === state.currentUser?.restaurantId && u.role !== 'super_admin'
      );
    }
    return [];
  };

  const filteredUsers = getFilteredUsers();

  // Get available restaurants for user assignment
  const getAvailableRestaurants = () => {
    if (state.currentUser?.role === 'super_admin') {
      return state.restaurants;
    } else if (state.currentUser?.role === 'admin') {
      return state.restaurants.filter(r => r.id === state.currentUser?.restaurantId);
    }
    return [];
  };

  const availableRestaurants = getAvailableRestaurants();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Set restaurant ID based on user role
      let restaurantId = formData.restaurantId;
      if (state.currentUser?.role === 'admin' && !restaurantId) {
        restaurantId = state.currentUser.restaurantId || '';
      }
      
      const userData = {
        ...formData,
        restaurantId: formData.role === 'super_admin' ? undefined : restaurantId,
      };

      if (editingUser) {
        const updatedUser = await apiService.updateUser(editingUser.id, userData);
        dispatch({
          type: 'UPDATE_USER',
          payload: updatedUser,
        });
      } else {
        const newUser = await apiService.createUser(userData);
        dispatch({
          type: 'ADD_USER',
          payload: newUser,
        });
      }
      resetForm();
    } catch (error: any) {
      alert('Failed to save user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'staff',
      password: '',
      active: true,
      restaurantId: state.currentUser?.role === 'admin' ? state.currentUser.restaurantId || '' : '',
    });
  };

  const handleEdit = (user: UserType) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: user.password,
      active: user.active,
      restaurantId: user.restaurantId || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await apiService.deleteUser(id);
        dispatch({ type: 'DELETE_USER', payload: id });
      } catch (error: any) {
        alert('Failed to delete user: ' + error.message);
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'staff': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailableRoles = () => {
    if (state.currentUser?.role === 'super_admin') {
      return [
        { value: 'admin', label: 'Admin' },
        { value: 'manager', label: 'Manager' },
        { value: 'staff', label: 'Staff' },
      ];
    } else if (state.currentUser?.role === 'admin') {
      return [
        { value: 'manager', label: 'Manager' },
        { value: 'staff', label: 'Staff' },
      ];
    }
    return [];
  };

  const availableRoles = getAvailableRoles();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{filteredUsers.length}</p>
            </div>
            <User className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredUsers.filter(u => u.active).length}
              </p>
            </div>
            <User className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-purple-600">
                {filteredUsers.filter(u => u.role === 'admin').length}
              </p>
            </div>
            <User className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Staff</p>
              <p className="text-2xl font-bold text-emerald-600">
                {filteredUsers.filter(u => u.role === 'staff').length}
              </p>
            </div>
            <User className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Restaurant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const restaurant = user.restaurantId ? 
                  state.restaurants.find(r => r.id === user.restaurantId) : null;
                
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-emerald-100 p-2 rounded-full">
                          <User className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                        {restaurant ? restaurant.name : 'All Restaurants'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {isValidDate(user.createdAt) ? parseDateTime(user.createdAt).toLocaleDateString() : 'Invalid Date'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
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

      {/* Add/Edit User Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserType['role'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {availableRoles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              {state.currentUser?.role === 'super_admin' && formData.role !== 'super_admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant</label>
                  <select
                    value={formData.restaurantId}
                    onChange={(e) => setFormData({ ...formData, restaurantId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">Select Restaurant</option>
                    {availableRestaurants.map(restaurant => (
                      <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="active" className="ml-2 block text-sm text-gray-700">Active</label>
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
                  {loading ? 'Saving...' : editingUser ? 'Update' : 'Add'} User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}