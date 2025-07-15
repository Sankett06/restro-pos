import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Building2, Phone, Mail, MapPin, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/api';
import { Restaurant } from '../types';
import CurrencySelector from './CurrencySelector';
import { getCurrencyByCode, CURRENCIES } from '../utils/currency';
import { useCurrency } from '../hooks/useCurrency';

export default function Restaurants() {
  const { state, dispatch } = useApp();
  const { formatAmount } = useCurrency();
  const [showForm, setShowForm] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    gstNumber: '',
    active: true,
    currency: 'USD',
    currencySymbol: '$',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingRestaurant) {
        const updatedRestaurant = await apiService.updateRestaurant(editingRestaurant.id, formData);
        dispatch({
          type: 'UPDATE_RESTAURANT',
          payload: updatedRestaurant,
        });
      } else {
        const newRestaurant = await apiService.createRestaurant(formData);
        dispatch({
          type: 'ADD_RESTAURANT',
          payload: newRestaurant,
        });
      }
      resetForm();
    } catch (error: any) {
      alert('Failed to save restaurant: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingRestaurant(null);
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      gstNumber: '',
      active: true,
      currency: 'USD',
      currencySymbol: '$',
    });
  };

  const handleEdit = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setFormData({
      name: restaurant.name,
      address: restaurant.address,
      phone: restaurant.phone,
      email: restaurant.email,
      gstNumber: restaurant.gstNumber || '',
      active: restaurant.active,
      currency: restaurant.currency || 'USD',
      currencySymbol: restaurant.currencySymbol || '$',
    });
    setShowForm(true);
  };

  const handleCurrencyChange = (currency: any) => {
    setFormData({
      ...formData,
      currency: currency.code,
      currencySymbol: currency.symbol,
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this restaurant? This will also delete all associated data.')) {
      try {
        await apiService.deleteRestaurant(id);
        dispatch({ type: 'DELETE_RESTAURANT', payload: id });
      } catch (error: any) {
        alert('Failed to delete restaurant: ' + error.message);
      }
    }
  };

  const toggleStatus = async (restaurant: Restaurant) => {
    try {
      const updatedRestaurant = await apiService.updateRestaurant(restaurant.id, {
        ...restaurant,
        active: !restaurant.active,
      });
      dispatch({
        type: 'UPDATE_RESTAURANT',
        payload: updatedRestaurant,
      });
    } catch (error: any) {
      alert('Failed to update restaurant status: ' + error.message);
    }
  };

  const totalRestaurants = state.restaurants.length;
  const activeRestaurants = state.restaurants.filter(r => r.active).length;
  const totalUsers = state.users.filter(u => u.role !== 'super_admin').length;
  const totalRevenue = state.orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Restaurant Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Restaurant</span>
        </button>
      </div>

      {/* Restaurant Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Restaurants</p>
              <p className="text-2xl font-bold text-gray-900">{totalRestaurants}</p>
            </div>
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Restaurants</p>
              <p className="text-2xl font-bold text-green-600">{activeRestaurants}</p>
            </div>
            <Building2 className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-purple-600">{totalUsers}</p>
            </div>
            <Building2 className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-emerald-600">${totalRevenue.toFixed(2)}</p>
            </div>
            <Building2 className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Restaurants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.restaurants.map((restaurant) => (
          <div key={restaurant.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{restaurant.name}</h3>
                <div className="mb-2">
                  <span className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                    {restaurant.currencySymbol || '$'} {restaurant.currency || 'USD'}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="truncate">{restaurant.address}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{restaurant.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="truncate">{restaurant.email}</span>
                  </div>
                  {restaurant.gstNumber && (
                    <div className="text-xs">
                      <span className="font-medium">GST:</span> {restaurant.gstNumber}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleEdit(restaurant)}
                  className="text-blue-600 hover:text-blue-900 p-1"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(restaurant.id)}
                  className="text-red-600 hover:text-red-900 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                restaurant.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {restaurant.active ? 'Active' : 'Inactive'}
              </span>
              <button
                onClick={() => toggleStatus(restaurant)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  restaurant.active 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {restaurant.active ? 'Deactivate' : 'Activate'}
              </button>
            </div>

            {/* Restaurant Stats */}
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {state.users.filter(u => u.restaurantId === restaurant.id).length}
                  </p>
                  <p className="text-xs text-gray-500">Users</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {state.orders.filter(o => o.restaurantId === restaurant.id).length}
                  </p>
                  <p className="text-xs text-gray-500">Orders</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {formatAmount(state.orders.filter(o => o.restaurantId === restaurant.id).reduce((sum, order) => sum + order.total, 0))}
                  </p>
                  <p className="text-xs text-gray-500">Revenue</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Restaurant Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">GST Number (Optional)</label>
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <CurrencySelector
                selectedCurrency={formData.currency}
                onCurrencyChange={handleCurrencyChange}
              />
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
                  {loading ? 'Saving...' : editingRestaurant ? 'Update' : 'Create'} Restaurant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}