import React, { useState } from 'react';
import { Building2, Plus, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Restaurant } from '../types';
import { apiService } from '../services/api';

export default function RestaurantSelector() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    gstNumber: '',
  });

  const userRestaurants = state.currentUser?.role === 'super_admin' 
    ? state.restaurants 
    : state.restaurants.filter(r => r.ownerId === state.currentUser?.id || state.currentUser?.restaurantId === r.id);

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    dispatch({ type: 'SET_CURRENT_RESTAURANT', payload: restaurant });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newRestaurant = await apiService.createRestaurant({
        ...formData,
        currency: 'USD',
        currencySymbol: '$',
      });
      dispatch({ type: 'ADD_RESTAURANT', payload: newRestaurant });
      setShowForm(false);
      setFormData({
        name: '',
        address: '',
        phone: '',
        email: '',
        gstNumber: '',
      });
    } catch (error: any) {
      alert('Failed to create restaurant: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (state.currentRestaurant) {
    return null; // Don't show selector if restaurant is already selected
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Select Restaurant</h1>
          <p className="text-gray-600">Choose a restaurant to manage or create a new one</p>
        </div>

        {/* Restaurant Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {userRestaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              onClick={() => handleSelectRestaurant(restaurant)}
              className="border-2 border-gray-200 rounded-xl p-6 hover:border-emerald-500 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="text-center">
                <Building2 className="h-12 w-12 text-gray-400 group-hover:text-emerald-600 mx-auto mb-4 transition-colors" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{restaurant.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{restaurant.address}</p>
                <p className="text-sm text-gray-500">{restaurant.phone}</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-3 ${
                  restaurant.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {restaurant.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}

          {/* Add New Restaurant Card */}
          {(state.currentUser?.role === 'super_admin' || state.currentUser?.role === 'admin') && (
            <div
              onClick={() => setShowForm(true)}
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-emerald-500 hover:bg-emerald-50 transition-all cursor-pointer group"
            >
              <div className="text-center">
                <Plus className="h-12 w-12 text-gray-400 group-hover:text-emerald-600 mx-auto mb-4 transition-colors" />
                <h3 className="text-lg font-semibold text-gray-700 group-hover:text-emerald-700 mb-2">
                  Add New Restaurant
                </h3>
                <p className="text-sm text-gray-500">Create a new restaurant location</p>
              </div>
            </div>
          )}
        </div>

        {userRestaurants.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Restaurants Found</h3>
            <p className="text-gray-500 mb-6">You don't have access to any restaurants yet.</p>
            {(state.currentUser?.role === 'super_admin' || state.currentUser?.role === 'admin') && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Create Your First Restaurant
              </button>
            )}
          </div>
        )}

        {/* Add Restaurant Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Restaurant</h3>
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
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Create Restaurant
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}