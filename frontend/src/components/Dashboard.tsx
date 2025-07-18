import React, { useState } from 'react';
import { TrendingUp, Users, ShoppingCart, DollarSign, Clock, ChefHat, Plus, Edit3, Eye } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Order, Table } from '../types';
import { apiService } from '../services/api';
import { useCurrency } from '../hooks/useCurrency';
import { format, startOfDay, endOfDay } from 'date-fns';
import { parseDateTime, isValidDate } from '../utils/dateUtils';

export default function Dashboard() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const { formatAmount } = useCurrency();
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [editingTable, setEditingTable] = useState<string | null>(null);

  // Calculate today's orders and revenue
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  
  // const todayOrders = state.orders.filter(order => {
  //   const orderDate = parseDateTime(order.createdAt);
  //   return isValidDate(orderDate) && orderDate >= todayStart && orderDate <= todayEnd && order.status !== 'cancelled';
  // });
  const todayOrders = state.orders.filter(order => {
  const orderDate = parseDateTime(order.createdAt);
  return (
    isValidDate(orderDate) &&
    orderDate >= todayStart &&
    orderDate <= todayEnd &&
    ['completed', 'served', 'delivered'].includes(order.status) // only count truly completed/successful ones
  );
});

  
  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
  const averageOrderValue = todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0;
  
  // Calculate active orders (pending, preparing, ready)
  //const activeOrders = state.orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status));
  const activeOrders = state.orders.filter(o => ['pending', 'preparing', 'ready', 'completed'].includes(o.status));

  
  // Calculate table occupancy
  const occupiedTables = state.tables.filter(t => t.status === 'occupied').length;
  const totalTables = state.tables.length;
  const occupancyRate = totalTables > 0 ? (occupiedTables / totalTables) * 100 : 0;
  
  // Calculate pending KOTs
  const pendingKOTs = state.kots.filter(k => k.status === 'pending').length;
  
  // Calculate revenue growth (comparing with yesterday)
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStart = startOfDay(yesterday);
  const yesterdayEnd = endOfDay(yesterday);
  
  const yesterdayOrders = state.orders.filter(order => {
    const orderDate = parseDateTime(order.createdAt);
    return isValidDate(orderDate) && orderDate >= yesterdayStart && orderDate <= yesterdayEnd && order.status !== 'cancelled';
  });
  
  const yesterdayRevenue = yesterdayOrders.reduce((sum, order) => sum + order.total, 0);
  const revenueGrowth = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;
  const handleOrderStatusChange = async (orderId: string, newStatus: Order['status']) => {
    const order = state.orders.find(o => o.id === orderId);
    if (order) {
      try {
        await apiService.updateOrderStatus(orderId, newStatus);
        dispatch({
          type: 'UPDATE_ORDER',
          payload: {
            ...order,
            status: newStatus,
            updatedAt: new Date(),
          },
        });

        // Update table status if order is completed/cancelled
        if ((newStatus === 'served' || newStatus === 'cancelled') && order.tableId) {
          const table = state.tables.find(t => t.id === order.tableId);
          if (table) {
            await apiService.updateTable(table.id, {
              ...table,
              status: 'available',
              currentOrderId: undefined,
            });
            dispatch({
              type: 'UPDATE_TABLE',
              payload: {
                ...table,
                status: 'available',
                currentOrderId: undefined,
              },
            });
          }
        }
      } catch (error: any) {
        alert('Failed to update order status: ' + error.message);
      }
    }
    setEditingOrder(null);
  };

  const handleTableStatusChange = async (tableId: string, newStatus: Table['status']) => {
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
    setEditingTable(null);
  };

  const stats = [
    {
      title: 'Today\'s Sales',
      value: formatAmount(todayRevenue),
      change: revenueGrowth >= 0 ? `+${revenueGrowth.toFixed(1)}%` : `${revenueGrowth.toFixed(1)}%`,
      changeColor: revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      subtitle: `${todayOrders.length} orders today`,
    },
    {
      title: 'Active Orders',
      value: activeOrders.length.toString(),
      change: `Avg: ${formatAmount(averageOrderValue)}`,
      changeColor: 'text-blue-600',
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      subtitle: 'Pending, preparing, ready',
    },
    {
      title: 'Tables Occupied',
      value: `${occupiedTables}/${totalTables}`,
      change: `${occupancyRate.toFixed(1)}% occupancy`,
      changeColor: occupancyRate > 70 ? 'text-orange-600' : 'text-green-600',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      subtitle: 'Current table status',
    },
    {
      title: 'KOT Pending',
      value: pendingKOTs.toString(),
      change: pendingKOTs > 5 ? 'High priority' : 'Normal',
      changeColor: pendingKOTs > 5 ? 'text-red-600' : 'text-green-600',
      icon: ChefHat,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      subtitle: 'Kitchen orders waiting',
    },
  ];

  const recentOrders = state.orders.slice(0, 5);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Last updated:</span>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
          <button
            onClick={() => navigate('/new-order')}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2 font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 truncate">{stat.title}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className={`text-sm mt-1 ${stat.changeColor || 'text-gray-500'}`}>{stat.change}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-gray-400 mt-1">{stat.subtitle}</p>
                  )}
                </div>
                <div className={`${stat.bgColor} p-2 sm:p-3 rounded-lg flex-shrink-0`}>
                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      {/* <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => navigate('/new-order')}
            className="p-3 sm:p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors text-center"
          >
            <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-emerald-700">New Order</p>
          </button>
          <button
            onClick={() => navigate('/tables')}
            className="p-3 sm:p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-center"
          >
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-blue-700">Manage Tables</p>
          </button>
          <button
            onClick={() => navigate('/kitchen')}
            className="p-3 sm:p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-center"
          >
            <ChefHat className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-orange-700">Kitchen</p>
          </button>
          <button
            onClick={() => navigate('/reports')}
            className="p-3 sm:p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-center"
          >
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-purple-700">Reports</p>
          </button>
        </div>
      </div> */}

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <button
              onClick={() => navigate('/orders')}
              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center space-x-1"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">View All</span>
            </button>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{order.orderNumber || order.order_number || 'N/A'}</p>
                  <p className="text-sm text-gray-500 capitalize">{order.type}</p>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatAmount(order.total)}</p>
                    <div className="flex items-center space-x-1">
                      {editingOrder === order.id ? (
                        <select
                          value={order.status}
                          onChange={(e) => handleOrderStatusChange(order.id, e.target.value as Order['status'])}
                          onBlur={() => setEditingOrder(null)}
                          className="text-xs px-1 py-0.5 rounded border focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          autoFocus
                        >
                          <option value="pending">Pending</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="served">Served</option>
                          {order.type === 'delivery' && <option value="delivered">Delivered</option>}
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      ) : (
                        <>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'ready' ? 'bg-green-100 text-green-800' :
                            order.status === 'served' ? 'bg-emerald-100 text-emerald-800' :
                            order.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                            order.status === 'delivered' ? 'bg-purple-100 text-purple-800' :             
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.status}
                          </span>
                          <button
                            onClick={() => setEditingOrder(order.id)}
                            className="text-gray-400 hover:text-gray-600 p-0.5"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Table Status */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Table Status</h3>
            <button
              onClick={() => navigate('/tables')}
              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center space-x-1"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Manage</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {state.tables.map((table) => (
              <div
                key={table.id}
                className={`p-2 sm:p-3 rounded-lg border-2 text-center transition-colors ${
                  table.status === 'available' ? 'bg-green-50 border-green-200 text-green-800' :
                  table.status === 'occupied' ? 'bg-red-50 border-red-200 text-red-800' :
                  'bg-yellow-50 border-yellow-200 text-yellow-800'
                }`}
              >
                <p className="font-medium text-sm sm:text-base">Table {table.number}</p>
                <p className="text-xs">{table.capacity} seats</p>
                <div className="mt-1">
                  {editingTable === table.id ? (
                    <select
                      value={table.status}
                      onChange={(e) => handleTableStatusChange(table.id, e.target.value as Table['status'])}
                      onBlur={() => setEditingTable(null)}
                      className="text-xs px-1 py-0.5 rounded border focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full"
                      autoFocus
                    >
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                      <option value="reserved">Reserved</option>
                    </select>
                  ) : (
                    <button
                      onClick={() => setEditingTable(table.id)}
                      className="text-xs hover:underline flex items-center justify-center space-x-1 w-full"
                    >
                      <span>{table.status}</span>
                      <Edit3 className="h-2 w-2" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sales Chart Placeholder */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Analytics</h3>
        <div className="h-48 sm:h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <TrendingUp className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm sm:text-base">Sales chart would be rendered here</p>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">Integration with charting library needed</p>
          </div>
        </div>
      </div>
    </div>
  );
}