import React from 'react';
import { Order } from '../types';
import { useApp } from '../context/AppContext';
import { format } from 'date-fns';
import { useCurrency } from '../hooks/useCurrency';
import { parseDateTime, isValidDate } from '../utils/dateUtils';

interface PrintableBillProps {
  order: Order;
  onClose: () => void;
}

export default function PrintableBill({ order, onClose }: PrintableBillProps) {
  const { state } = useApp();
  const { formatAmount } = useCurrency();

  const handlePrint = () => {
    window.print();
  };

  const table = order.tableId ? state.tables.find(t => t.id === order.tableId) : null;
  const staff = state.staff.find(s => s.id === order.staffId) || 
               state.users.find(u => u.id === order.staffId);
  const restaurant = state.currentRestaurant || 
                    state.restaurants.find(r => r.id === order.restaurantId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Print Styles */}
        <style jsx>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-area, .print-area * {
              visibility: visible;
            }
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
            .print-area {
              font-size: 12px;
              line-height: 1.4;
            }
          }
        `}</style>

        {/* Bill Content */}
        <div className="print-area p-6">
          {/* Restaurant Header */}
          <div className="text-center border-b-2 border-gray-300 pb-4 mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{restaurant?.name || 'RestaurantPOS'}</h1>
            <p className="text-sm text-gray-600">{restaurant?.address || '123 Main Street, City, State 12345'}</p>
            <p className="text-sm text-gray-600">Phone: {restaurant?.phone || '(555) 123-4567'}</p>
            <p className="text-sm text-gray-600">Email: {restaurant?.email || 'info@restaurantpos.com'}</p>
            {restaurant?.gstNumber && (
              <p className="text-xs text-gray-500 mt-2">GST No: {restaurant.gstNumber}</p>
            )}
          </div>

          {/* Bill Header */}
          <div className="mb-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="text-lg font-bold">BILL</h2>
                <p className="text-sm">Bill No: {order.orderNumber}</p>
              </div>
              <div className="text-right text-sm">
                <p>Date: {isValidDate(order.createdAt) ? format(parseDateTime(order.createdAt), 'dd/MM/yyyy') : 'Invalid Date'}</p>
                <p>Time: {isValidDate(order.createdAt) ? format(parseDateTime(order.createdAt), 'HH:mm:ss') : 'Invalid Time'}</p>
              </div>
            </div>

            {/* Customer/Table Info */}
            <div className="bg-gray-50 p-3 rounded mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Service Type:</strong> {order.type.charAt(0).toUpperCase() + order.type.slice(1)}</p>
                  {order.type === 'dine-in' && table && (
                    <p><strong>Table:</strong> {table.number} ({table.location})</p>
                  )}
                  {order.customerInfo && (
                    <>
                      <p><strong>Customer:</strong> {order.customerInfo.name}</p>
                      <p><strong>Phone:</strong> {order.customerInfo.phone}</p>
                      {order.customerInfo.address && (
                        <p><strong>Address:</strong> {order.customerInfo.address}</p>
                      )}
                    </>
                  )}
                </div>
                <div>
                  <p><strong>Served by:</strong> {staff?.name || 'N/A'}</p>
                  <p><strong>Status:</strong> {order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-2">Item</th>
                  <th className="text-center py-2">Qty</th>
                  <th className="text-right py-2">Rate</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => {
                  const menuItem = state.menuItems.find(mi => mi.id === item.menuItemId);
                  return (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-2">
                        <div>
                          <p className="font-medium">{menuItem?.name || 'Unknown Item'}</p>
                          {item.specialInstructions && (
                            <p className="text-xs text-gray-500 italic">Note: {item.specialInstructions}</p>
                          )}
                        </div>
                      </td>
                      <td className="text-center py-2">{item.quantity}</td>
                      <td className="text-right py-2">{formatAmount(item.price)}</td>
                      <td className="text-right py-2">{formatAmount(item.quantity * item.price)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bill Summary */}
          <div className="border-t-2 border-gray-300 pt-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatAmount(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (10%):</span>
                <span>{formatAmount(order.tax)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Charge (5%):</span>
                <span>{formatAmount(order.serviceCharge)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-{formatAmount(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2">
                <span>TOTAL:</span>
                <span>{formatAmount(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
            <p>Thank you for dining with us!</p>
            <p>Please visit us again</p>
            <p className="mt-2">This is a computer generated bill</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="no-print flex justify-end space-x-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Print Bill
          </button>
        </div>
      </div>
    </div>
  );
}