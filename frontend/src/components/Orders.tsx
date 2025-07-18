import React, { useState } from 'react';
import { Eye, Printer, Trash2, ShoppingCart, Clock, CheckCircle, XCircle, Receipt, ChefHat } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Order as OrderType } from '../types';
import { format } from 'date-fns';
import PrintableBill from './PrintableBill';
import PrintableKOT from './PrintableKOT';
import { useCurrency } from '../hooks/useCurrency';
import { parseDateTime, isValidDate } from '../utils/dateUtils';

export default function Orders() {
  const { state, dispatch } = useApp();
  const { formatAmount } = useCurrency();
  const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showBill, setShowBill] = useState(false);
  const [showKOT, setShowKOT] = useState(false);
  const [printOrder, setPrintOrder] = useState<OrderType | null>(null);

  const filteredOrders = statusFilter === 'all' 
    ? state.orders 
    : state.orders.filter(order => order.status === statusFilter);

  const handleStatusChange = (orderId: string, newStatus: OrderType['status']) => {
    const order = state.orders.find(o => o.id === orderId);
    if (order) {
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
    }
  };

  const handleDeleteOrder = (id: string) => {
    if (confirm('Are you sure you want to delete this order?')) {
      dispatch({ type: 'DELETE_ORDER', payload: id });
    }
  };

  const handlePrintBill = (order: OrderType) => {
    setPrintOrder(order);
    setShowBill(true);
  };

  const handlePrintKOT = (order: OrderType) => {
    const kot = state.kots.find(k => k.orderId === order.id);
    if (kot) {
      setPrintOrder(order);
      setShowKOT(true);
    } else {
      alert('KOT not found for this order');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'served': return 'bg-emerald-100 text-emerald-800';
      case 'delivered': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-emerald-200 text-emerald-900';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'preparing': return Clock;
      case 'ready': return CheckCircle;
      case 'served': return CheckCircle;
      case 'delivered': return CheckCircle;
      case 'completed': return CheckCircle;
      case 'cancelled': return XCircle;
      default: return Clock;
    }
  };

  const totalOrders = state.orders.length;
  const pendingOrders = state.orders.filter(o => o.status === 'pending').length;
  const preparingOrders = state.orders.filter(o => o.status === 'preparing').length;
  
  // Calculate today's revenue properly
  const today = new Date();
  const todayRevenue = state.orders
    .filter(o => {
      const orderDate = parseDateTime(o.createdAt);
      return isValidDate(orderDate) && format(orderDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') && o.status !== 'cancelled';
    })
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
        <div className="flex items-center space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="served">Served</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Order Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingOrders}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Preparing</p>
              <p className="text-2xl font-bold text-blue-600">{preparingOrders}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
              <p className="text-2xl font-bold text-emerald-600">{formatAmount(todayRevenue)}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer/Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => {
                const table = order.tableId ? state.tables.find(t => t.id === order.tableId) : null;
                const StatusIcon = getStatusIcon(order.status);
                
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.orderNumber || order.order_number || 'N/A'}</div>
                        <div className="text-sm text-gray-500 capitalize">{order.type}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.type === 'dine-in' ? (
                          `Table ${table?.number || 'N/A'}`
                        ) : (
                          order.customerInfo?.name || 'N/A'
                        )}
                      </div>
                      {order.customerInfo?.phone && (
                        <div className="text-sm text-gray-500">{order.customerInfo.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.items.slice(0, 2).map((item) => {
                          const menuItem = state.menuItems.find(mi => mi.id === item.menuItemId);
                          return menuItem?.name;
                        }).join(', ')}
                        {order.items.length > 2 && '...'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatAmount(order.total)}</div>
                      <div className="text-sm text-gray-500">
                        Subtotal: {formatAmount(order.subtotal)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <StatusIcon className="h-4 w-4" />
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderType['status'])}
                          className={`text-xs px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-emerald-500 ${getStatusColor(order.status)}`}
                        >
                          <option value="pending">Pending</option>
<option value="preparing">Preparing</option>
<option value="ready">Ready</option>
<option value="served">Served</option>
{order.type !== 'dine-in' && <option value="delivered">Delivered</option>}
<option value="completed">Completed</option>
<option value="cancelled">Cancelled</option>

                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {isValidDate(order.createdAt) ? format(parseDateTime(order.createdAt), 'MMM dd, HH:mm') : 'Invalid Date'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Updated: {isValidDate(order.updatedAt) ? format(parseDateTime(order.updatedAt), 'HH:mm') : 'Invalid Date'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handlePrintBill(order)}
                          className="text-emerald-600 hover:text-emerald-900 p-1"
                          title="Print Bill"
                        >
                          <Receipt className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handlePrintKOT(order)}
                          className="text-orange-600 hover:text-orange-900 p-1"
                          title="Print KOT"
                        >
                          <ChefHat className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete Order"
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

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Order Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Order Number:</span> {selectedOrder.orderNumber}</p>
                    <p><span className="text-gray-500">Type:</span> {selectedOrder.type}</p>
                    <p><span className="text-gray-500">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </p>
                    <p><span className="text-gray-500">Created:</span> {isValidDate(selectedOrder.createdAt) ? format(parseDateTime(selectedOrder.createdAt), 'MMM dd, yyyy HH:mm') : 'Invalid Date'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                  <div className="space-y-1 text-sm">
                    {selectedOrder.type === 'dine-in' ? (
                      <p><span className="text-gray-500">Table:</span> {
                        state.tables.find(t => t.id === selectedOrder.tableId)?.number || 'N/A'
                      }</p>
                    ) : (
                      <>
                        <p><span className="text-gray-500">Name:</span> {selectedOrder.customerInfo?.name}</p>
                        <p><span className="text-gray-500">Phone:</span> {selectedOrder.customerInfo?.phone}</p>
                        {selectedOrder.customerInfo?.address && (
                          <p><span className="text-gray-500">Address:</span> {selectedOrder.customerInfo.address}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => {
                    const menuItem = state.menuItems.find(mi => mi.id === item.menuItemId);
                    return (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{menuItem?.name}</p>
                          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                          {item.specialInstructions && (
                            <p className="text-sm text-gray-500">Note: {item.specialInstructions}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatAmount(item.price * item.quantity)}</p>
                          <p className="text-sm text-gray-500">{formatAmount(item.price)} each</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Order Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatAmount(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{formatAmount(selectedOrder.tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Charge</span>
                    <span>{formatAmount(selectedOrder.serviceCharge)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatAmount(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>{formatAmount(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => handlePrintBill(selectedOrder)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                >
                  <Receipt className="h-4 w-4" />
                  <span>Print Bill</span>
                </button>
                <button
                  onClick={() => handlePrintKOT(selectedOrder)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <ChefHat className="h-4 w-4" />
                  <span>Print KOT</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Modals */}
      {showBill && printOrder && (
        <PrintableBill
          order={printOrder}
          onClose={() => {
            setShowBill(false);
            setPrintOrder(null);
          }}
        />
      )}

      {showKOT && printOrder && (
        <PrintableKOT
          kot={state.kots.find(k => k.orderId === printOrder.id)!}
          onClose={() => {
            setShowKOT(false);
            setPrintOrder(null);
          }}
        />
      )}
    </div>
  );
}