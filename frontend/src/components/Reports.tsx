import React, { useState } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Users, Calendar, Download, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/api';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useCurrency } from '../hooks/useCurrency';
import { parseDateTime, isValidDate } from '../utils/dateUtils';

export default function Reports() {
  const { state } = useApp();
  const { formatAmount } = useCurrency();
  const [dateRange, setDateRange] = useState('today');
  const [reportType, setReportType] = useState('overview');
  const [loading, setLoading] = useState(false);

  // Calculate date ranges
  const getDateRange = () => {
    const today = new Date();
    switch (dateRange) {
      case 'today':
        return { start: startOfDay(today), end: endOfDay(today) };
      case 'week':
        return { start: startOfWeek(today), end: endOfWeek(today) };
      case 'month':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      default:
        return { start: startOfDay(today), end: endOfDay(today) };
    }
  };

  const { start: dateStart, end: dateEnd } = getDateRange();

  // Filter orders by date range
  const filteredOrders = state.orders.filter(order => {
    const orderDate = parseDateTime(order.createdAt);
    return isValidDate(orderDate) && orderDate >= dateStart && orderDate <= dateEnd && order.status !== 'cancelled';
  });

  // Calculate summary metrics
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = filteredOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const uniqueCustomers = new Set(filteredOrders.map(order => order.customerInfo?.phone).filter(Boolean)).size;

  // Calculate order type distribution
  const orderTypes = ['dine-in', 'takeaway', 'delivery'].map(type => {
    const typeOrders = filteredOrders.filter(order => order.type === type);
    return {
      type,
      count: typeOrders.length,
      revenue: typeOrders.reduce((sum, order) => sum + order.total, 0),
    };
  });

  // Calculate top selling items
  const itemSales = new Map();
  filteredOrders.forEach(order => {
    order.items.forEach(item => {
      const menuItem = state.menuItems.find(mi => mi.id === item.menuItemId);
      if (menuItem) {
        const existing = itemSales.get(item.menuItemId) || { 
          name: menuItem.name, 
          category: menuItem.category,
          totalQuantity: 0, 
          totalRevenue: 0 
        };
        existing.totalQuantity += item.quantity;
        existing.totalRevenue += item.quantity * item.price;
        itemSales.set(item.menuItemId, existing);
      }
    });
  });

  const topItems = Array.from(itemSales.values())
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 10);

  // Calculate staff performance
  const staffPerformance = state.users
    .filter(user => user.restaurantId === state.currentRestaurant?.id)
    .map(user => {
      const userOrders = filteredOrders.filter(order => order.staffId === user.id);
      return {
        staffName: user.name,
        ordersHandled: userOrders.length,
        revenueGenerated: userOrders.reduce((sum, order) => sum + order.total, 0),
      };
    })
    .filter(staff => staff.ordersHandled > 0)
    .sort((a, b) => b.revenueGenerated - a.revenueGenerated);

  // Calculate table utilization
  const tableUtilization = state.tables.map(table => {
    const tableOrders = filteredOrders.filter(order => order.tableId === table.id);
    return {
      tableNumber: table.number,
      capacity: table.capacity,
      location: table.location,
      ordersServed: tableOrders.length,
      revenueGenerated: tableOrders.reduce((sum, order) => sum + order.total, 0),
      averageOrderValue: tableOrders.length > 0 ? tableOrders.reduce((sum, order) => sum + order.total, 0) / tableOrders.length : 0,
    };
  }).sort((a, b) => b.revenueGenerated - a.revenueGenerated);

  // Calculate daily sales trend
  const dailySales = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    const dayOrders = state.orders.filter(order => {
      const orderDate = parseDateTime(order.createdAt);
      return isValidDate(orderDate) && orderDate >= dayStart && orderDate <= dayEnd && order.status !== 'cancelled';
    });
    
    dailySales.push({
      date: format(date, 'MMM dd'),
      orders: dayOrders.length,
      revenue: dayOrders.reduce((sum, order) => sum + order.total, 0),
    });
  }

  const exportReport = async () => {
    const exportData = {
      period: dateRange,
      type: reportType,
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        uniqueCustomers,
      },
      topItems,
      staffPerformance,
      orderTypes,
      tableUtilization,
      dailySales,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `restaurant-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading reports...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="overview">Overview</option>
            <option value="sales">Sales</option>
            <option value="staff">Staff</option>
            <option value="inventory">Inventory</option>
          </select>
          <button
            onClick={exportReport}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatAmount(totalRevenue)}</p>
              <p className="text-sm text-gray-500">{dateRange} period</p>
            </div>
            <DollarSign className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
              <p className="text-sm text-gray-500">{filteredOrders.filter(o => o.status === 'served').length} completed</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatAmount(averageOrderValue)}</p>
              <p className="text-sm text-gray-500">Per order average</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
             <p className="text-sm font-medium text-gray-600">Unique Customers</p>
             <p className="text-2xl font-bold text-gray-900">{uniqueCustomers}</p>
             <p className="text-sm text-gray-500">With phone numbers</p>
            </div>
            <Users className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Type Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Type Distribution</h3>
          <div className="space-y-4">
            {orderTypes.map((orderType: any) => {
             const percentage = totalOrders > 0 ? (orderType.count / totalOrders) * 100 : 0;
              return (
                <div key={orderType.type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      orderType.type === 'dine-in' ? 'bg-blue-500' :
                      orderType.type === 'takeaway' ? 'bg-green-500' : 'bg-purple-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-700 capitalize">{orderType.type}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{orderType.count}</span>
                    <span className="text-xs text-gray-500 ml-2">({percentage.toFixed(1)}%)</span>
                   <div className="text-xs text-gray-400">{formatAmount(orderType.revenue)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Popular Items */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Items</h3>
          <div className="space-y-3">
            {topItems.map((item: any, index: number) => (
              <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full text-xs font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <span className="font-medium text-gray-900">{item.name}</span>
                    <div className="text-xs text-gray-500">{item.category}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">{item.totalQuantity} sold</div>
                  <div className="text-xs text-gray-500">{formatAmount(item.totalRevenue)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Staff Performance */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Performance</h3>
          <div className="space-y-3">
            {staffPerformance.map((staff: any, index: number) => (
             <div key={staff.staffName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-900">{staff.staffName}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">{staff.ordersHandled} orders</div>
                  <div className="text-xs text-gray-500">{formatAmount(staff.revenueGenerated)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Table Utilization */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Table Performance</h3>
          <div className="space-y-3">
           {tableUtilization.slice(0, 5).map((table: any, index: number) => (
             <div key={table.tableNumber} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-orange-100 text-orange-600 rounded-full text-xs font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <span className="font-medium text-gray-900">Table {table.tableNumber}</span>
                    <div className="text-xs text-gray-500">{table.location} • {table.capacity} seats</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">{table.ordersServed} orders</div>
                  <div className="text-xs text-gray-500">{formatAmount(table.revenueGenerated)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sales Trend Chart Placeholder */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Sales trend chart would be rendered here</p>
            <p className="text-sm text-gray-400 mt-1">Integration with charting library needed</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {filteredOrders.slice(0, 10).map((order) => (
            <div key={order.id} className="flex items-center justify-between p-3 border-l-4 border-emerald-500 bg-emerald-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{order.orderNumber}</p>
                <p className="text-sm text-gray-500">
                  {isValidDate(order.createdAt) ? format(parseDateTime(order.createdAt), 'MMM dd, HH:mm') : 'Invalid Date'} • {order.type}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-emerald-600">{formatAmount(order.total)}</p>
                <p className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                  {order.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'served': return 'bg-emerald-100 text-emerald-800';
      case 'delivered': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}