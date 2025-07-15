import React, { useState } from 'react';
import { Plus, Minus, ShoppingCart, Utensils, Package, Truck, Receipt, ChefHat } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OrderItem } from '../types';
import PrintableBill from './PrintableBill';
import PrintableKOT from './PrintableKOT';
import { apiService } from '../services/api';
import { useCurrency } from '../hooks/useCurrency';

export default function NewOrder() {
  const { state, dispatch } = useApp();
  const { formatAmount } = useCurrency();
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | 'delivery'>('dine-in');
  const [selectedTable, setSelectedTable] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showBill, setShowBill] = useState(false);
  const [showKOT, setShowKOT] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [currentKOT, setCurrentKOT] = useState(null);
  const [loading, setLoading] = useState(false);

  const categories = ['All', ...new Set(state.menuItems.map(item => item.category))];
  const filteredItems = selectedCategory === 'All' 
    ? state.menuItems.filter(item => item.available)
    : state.menuItems.filter(item => item.category === selectedCategory && item.available);

  const addToOrder = (menuItemId: string) => {
    const existingItem = orderItems.find(item => item.menuItemId === menuItemId);
    const menuItem = state.menuItems.find(item => item.id === menuItemId);
    
    if (!menuItem || menuItem.stock <= 0) {
      alert('Item is out of stock');
      return;
    }

    if (existingItem) {
      if (existingItem.quantity >= menuItem.stock) {
        alert('Cannot add more items. Stock limit reached.');
        return;
      }
      setOrderItems(orderItems.map(item =>
        item.menuItemId === menuItemId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setOrderItems([...orderItems, {
        id: Date.now().toString(),
        menuItemId,
        quantity: 1,
        price: menuItem.price,
      }]);
    }
  };

  const removeFromOrder = (menuItemId: string) => {
    const existingItem = orderItems.find(item => item.menuItemId === menuItemId);
    
    if (existingItem && existingItem.quantity > 1) {
      setOrderItems(orderItems.map(item =>
        item.menuItemId === menuItemId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
    } else {
      setOrderItems(orderItems.filter(item => item.menuItemId !== menuItemId));
    }
  };

  const updateSpecialInstructions = (menuItemId: string, instructions: string) => {
    setOrderItems(orderItems.map(item =>
      item.menuItemId === menuItemId
        ? { ...item, specialInstructions: instructions }
        : item
    ));
  };

  const calculateTotal = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1;
    const serviceCharge = subtotal * 0.05;
    const total = subtotal + tax + serviceCharge;
    
    return { subtotal, tax, serviceCharge, total };
  };

  const handleSubmitOrder = async () => {
    if (orderItems.length === 0) {
      alert('Please add items to the order');
      return;
    }

    if (orderType === 'dine-in' && !selectedTable) {
      alert('Please select a table');
      return;
    }

    if ((orderType === 'takeaway' || orderType === 'delivery') && !customerInfo.name) {
      alert('Please enter customer information');
      return;
    }

    setLoading(true);
    const { subtotal, tax, serviceCharge, total } = calculateTotal();

    const orderData = {
      type: orderType,
      tableId: orderType === 'dine-in' ? selectedTable : undefined,
      customerName: orderType !== 'dine-in' ? customerInfo.name : undefined,
      customerPhone: orderType !== 'dine-in' ? customerInfo.phone : undefined,
      customerAddress: orderType === 'delivery' ? customerInfo.address : undefined,
      items: orderItems,
      subtotal,
      tax,
      serviceCharge,
      discount: 0,
      total,
    };

    try {
      const newOrder = await apiService.createOrder(orderData);
      dispatch({ type: 'ADD_ORDER', payload: newOrder });

      // Get the created KOT
      const kots = await apiService.getKOTs();
      const kot = kots.find(k => k.orderId === newOrder.id);
      if (kot) {
        dispatch({ type: 'ADD_KOT', payload: kot });
        setCurrentKOT(kot);
      }

      // Update local state for menu items and tables
      if (orderType === 'dine-in' && selectedTable) {
        const table = state.tables.find(t => t.id === selectedTable);
        if (table) {
          dispatch({
            type: 'UPDATE_TABLE',
            payload: {
              ...table,
              status: 'occupied',
              currentOrderId: newOrder.id,
            },
          });
        }
      }

      // Update menu item stock locally
      orderItems.forEach(item => {
        const menuItem = state.menuItems.find(mi => mi.id === item.menuItemId);
        if (menuItem) {
          dispatch({
            type: 'UPDATE_MENU_ITEM',
            payload: {
              ...menuItem,
              stock: menuItem.stock - item.quantity,
            },
          });
        }
      });

      setCurrentOrder(newOrder);
      
      // Reset form
      setOrderItems([]);
      setSelectedTable('');
      setCustomerInfo({ name: '', phone: '', address: '' });
      
      alert('Order created successfully! You can now print the bill and KOT.');
    } catch (error: any) {
      alert('Failed to create order: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, tax, serviceCharge, total } = calculateTotal();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">New Order</h1>
        {currentOrder && (
          <div className="flex space-x-2">
            <button
              onClick={() => setShowBill(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
            >
              <Receipt className="h-4 w-4" />
              <span>Print Bill</span>
            </button>
            <button
              onClick={() => setShowKOT(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <ChefHat className="h-4 w-4" />
              <span>Print KOT</span>
            </button>
          </div>
        )}
      </div>

      {/* Order Type Selection */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { type: 'dine-in', label: 'Dine In', icon: Utensils },
            { type: 'takeaway', label: 'Takeaway', icon: Package },
            { type: 'delivery', label: 'Delivery', icon: Truck },
          ].map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => setOrderType(type as any)}
              className={`p-4 rounded-lg border-2 transition-colors ${
                orderType === type
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon className="h-8 w-8 mx-auto mb-2" />
              <p className="font-medium">{label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Table Selection for Dine-in */}
      {orderType === 'dine-in' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Table</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {state.tables.filter(table => table.status === 'available').map((table) => (
              <button
                key={table.id}
                onClick={() => setSelectedTable(table.id)}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  selectedTable === table.id
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-medium">Table {table.number}</p>
                <p className="text-sm text-gray-500">{table.capacity} seats</p>
                <p className="text-xs text-gray-400">{table.location}</p>
              </button>
            ))}
          </div>
          {state.tables.filter(table => table.status === 'available').length === 0 && (
            <p className="text-center text-gray-500 py-8">No tables available</p>
          )}
        </div>
      )}

      {/* Customer Information for Takeaway/Delivery */}
      {(orderType === 'takeaway' || orderType === 'delivery') && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Customer Name *"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
            <input
              type="tel"
              placeholder="Phone Number *"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
            {orderType === 'delivery' && (
              <input
                type="text"
                placeholder="Delivery Address *"
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 md:col-span-2"
                required
              />
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Items */}
        <div className="lg:col-span-2 space-y-4">
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
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map((item) => {
                const orderItem = orderItems.find(oi => oi.menuItemId === item.id);
                const isOutOfStock = item.stock <= 0;
                const isLowStock = item.stock <= 5 && item.stock > 0;
                
                return (
                  <div key={item.id} className={`border rounded-lg p-4 transition-shadow ${
                    isOutOfStock ? 'opacity-50 bg-gray-50' : 'hover:shadow-md'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500 mb-1">{item.description}</p>
                        <p className="text-xs text-gray-400">Stock: {item.stock}</p>
                        {isLowStock && (
                          <p className="text-xs text-orange-600 font-medium">Low Stock!</p>
                        )}
                        {isOutOfStock && (
                          <p className="text-xs text-red-600 font-medium">Out of Stock</p>
                        )}
                      </div>
                      <span className="text-lg font-semibold text-emerald-600">
                        {formatAmount(item.price)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {orderItem && (
                          <button
                            onClick={() => removeFromOrder(item.id)}
                            className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                            disabled={isOutOfStock}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        )}
                        {orderItem && (
                          <span className="w-8 text-center font-medium">
                            {orderItem.quantity}
                          </span>
                        )}
                        <button
                          onClick={() => addToOrder(item.id)}
                          className="p-1 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isOutOfStock}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {orderItem && (
                      <div className="mt-3">
                        <input
                          type="text"
                          placeholder="Special instructions..."
                          value={orderItem.specialInstructions || ''}
                          onChange={(e) => updateSpecialInstructions(item.id, e.target.value)}
                          className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6 h-fit">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Order Summary
          </h2>
          
          <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
            {orderItems.map((item) => {
              const menuItem = state.menuItems.find(mi => mi.id === item.menuItemId);
              return (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{menuItem?.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.quantity} × {formatAmount(item.price)}
                    </p>
                    {item.specialInstructions && (
                      <p className="text-xs text-blue-600 italic">
                        Note: {item.specialInstructions}
                      </p>
                    )}
                  </div>
                  <span className="font-medium">
                    {formatAmount(item.quantity * item.price)}
                  </span>
                </div>
              );
            })}
          </div>

          {orderItems.length > 0 && (
            <>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatAmount(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (10%)</span>
                  <span>{formatAmount(tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Charge (5%)</span>
                  <span>{formatAmount(serviceCharge)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>{formatAmount(total)}</span>
                </div>
              </div>

              <button
                onClick={handleSubmitOrder}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors mt-4"
              >
                Place Order
              </button>
            </>
          )}

          {orderItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No items in order</p>
            </div>
          )}
        </div>
      </div>

      {/* Print Modals */}
      {showBill && currentOrder && (
        <PrintableBill
          order={currentOrder}
          onClose={() => setShowBill(false)}
        />
      )}

      {showKOT && currentKOT && (
        <PrintableKOT
          kot={currentKOT}
          onClose={() => setShowKOT(false)}
        />
      )}
    </div>
  );
}