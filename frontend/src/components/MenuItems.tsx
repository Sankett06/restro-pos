import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Menu, DollarSign, Package } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/api';
import { MenuItem as MenuItemType } from '../types';
import { useCurrency } from '../hooks/useCurrency';

export default function MenuItems() {
  const { state, dispatch } = useApp();
  const { formatAmount } = useCurrency();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: 0,
    stock: 0,
    available: true,
  });

  const categories = ['All', ...new Set(state.menuItems.map(item => item.category))];
  const filteredItems = selectedCategory === 'All' 
    ? state.menuItems 
    : state.menuItems.filter(item => item.category === selectedCategory);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingItem) {
        const updatedItem = await apiService.updateMenuItem(editingItem.id, formData);
        dispatch({
          type: 'UPDATE_MENU_ITEM',
          payload: updatedItem,
        });
      } else {
        const newItem = await apiService.createMenuItem(formData);
        dispatch({
          type: 'ADD_MENU_ITEM',
          payload: newItem,
        });
      }
      resetForm();
    } catch (error: any) {
      alert('Failed to save menu item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      price: 0,
      stock: 0,
      available: true,
    });
  };

  const handleEdit = (item: MenuItemType) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price,
      stock: item.stock,
      available: item.available,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      try {
        await apiService.deleteMenuItem(id);
        dispatch({ type: 'DELETE_MENU_ITEM', payload: id });
      } catch (error: any) {
        alert('Failed to delete menu item: ' + error.message);
      }
    }
  };

  const toggleAvailability = async (item: MenuItemType) => {
    try {
      const updatedItem = await apiService.updateMenuItem(item.id, {
        ...item,
        available: !item.available,
      });
      dispatch({
        type: 'UPDATE_MENU_ITEM',
        payload: updatedItem,
      });
    } catch (error: any) {
      alert('Failed to update menu item: ' + error.message);
    }
  };

  const totalItems = state.menuItems.length;
  const availableItems = state.menuItems.filter(item => item.available).length;
  const lowStockItems = state.menuItems.filter(item => item.stock < 10).length;
  const totalValue = state.menuItems.reduce((sum, item) => sum + (item.price * item.stock), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Menu Item</span>
        </button>
      </div>

      {/* Menu Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
            </div>
            <Menu className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold text-green-600">{availableItems}</p>
            </div>
            <Package className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-red-600">{lowStockItems}</p>
            </div>
            <Package className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inventory Value</p>
              <p className="text-2xl font-bold text-emerald-600">{formatAmount(totalValue)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  {item.category}
                </span>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleEdit(item)}
                  className="text-blue-600 hover:text-blue-900 p-1"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-red-600 hover:text-red-900 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-emerald-600">{formatAmount(item.price)}</span>
                <span className={`text-sm ${item.stock < 10 ? 'text-red-600' : 'text-gray-600'}`}>
                  Stock: {item.stock}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {item.available ? 'Available' : 'Unavailable'}
                </span>
                <button
                  onClick={() => toggleAvailability(item)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    item.available 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {item.available ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Menu Item Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  placeholder="e.g., Pizza, Salads, Beverages"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                    min="0"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="available" className="ml-2 block text-sm text-gray-700">Available</label>
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
                  {loading ? 'Saving...' : editingItem ? 'Update' : 'Add'} Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}