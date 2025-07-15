import React from 'react';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/api';
import { parseDateTime, isValidDate } from '../utils/dateUtils';

export default function Kitchen() {
  const { state, dispatch } = useApp();

  const handleUpdateKOTStatus = async (kotId: string, status: 'pending' | 'preparing' | 'ready') => {
    const kot = state.kots.find(k => k.id === kotId);
    if (kot) {
      try {
        await apiService.updateKOTStatus(kotId, status);
        dispatch({
          type: 'UPDATE_KOT',
          payload: {
            ...kot,
            status,
          },
        });

        // Update order status accordingly
        const order = state.orders.find(o => o.id === kot.orderId);
        if (order) {
          let orderStatus = order.status;
          if (status === 'preparing') orderStatus = 'preparing';
          if (status === 'ready') orderStatus = 'ready';

          dispatch({
            type: 'UPDATE_ORDER',
            payload: {
              ...order,
              status: orderStatus,
              updatedAt: new Date(),
            },
          });
        }
      } catch (error: any) {
        alert('Failed to update KOT status: ' + error.message);
      }
    }
  };

  const pendingKOTs = state.kots.filter(kot => kot.status === 'pending');
  const preparingKOTs = state.kots.filter(kot => kot.status === 'preparing');
  const readyKOTs = state.kots.filter(kot => kot.status === 'ready');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Kitchen Orders (KOT)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Orders */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
            Pending ({pendingKOTs.length})
          </h2>
          <div className="space-y-4">
            {pendingKOTs.map((kot) => (
              <div key={kot.id} className="border-l-4 border-red-500 bg-red-50 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{kot.orderNumber}</h3>
                    <p className="text-sm text-gray-500">
                      {kot.type === 'dine-in' ? `Table ${kot.tableNumber}` : kot.type}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {isValidDate(kot.createdAt) ? parseDateTime(kot.createdAt).toLocaleTimeString() : 'Invalid Time'}
                  </span>
                </div>
                
                <div className="space-y-2 mb-3">
                  {kot.items.map((item) => {
                    const menuItem = state.menuItems.find(mi => mi.id === item.menuItemId);
                    return (
                      <div key={item.id} className="flex justify-between">
                        <span className="text-sm">{menuItem?.name}</span>
                        <span className="text-sm font-medium">×{item.quantity}</span>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => handleUpdateKOTStatus(kot.id, 'preparing')}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Preparing
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Preparing Orders */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-500" />
            Preparing ({preparingKOTs.length})
          </h2>
          <div className="space-y-4">
            {preparingKOTs.map((kot) => (
              <div key={kot.id} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{kot.orderNumber}</h3>
                    <p className="text-sm text-gray-500">
                      {kot.type === 'dine-in' ? `Table ${kot.tableNumber}` : kot.type}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {isValidDate(kot.createdAt) ? parseDateTime(kot.createdAt).toLocaleTimeString() : 'Invalid Time'}
                  </span>
                </div>
                
                <div className="space-y-2 mb-3">
                  {kot.items.map((item) => {
                    const menuItem = state.menuItems.find(mi => mi.id === item.menuItemId);
                    return (
                      <div key={item.id} className="flex justify-between">
                        <span className="text-sm">{menuItem?.name}</span>
                        <span className="text-sm font-medium">×{item.quantity}</span>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => handleUpdateKOTStatus(kot.id, 'ready')}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Mark as Ready
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Ready Orders */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            Ready ({readyKOTs.length})
          </h2>
          <div className="space-y-4">
            {readyKOTs.map((kot) => (
              <div key={kot.id} className="border-l-4 border-green-500 bg-green-50 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{kot.orderNumber}</h3>
                    <p className="text-sm text-gray-500">
                      {kot.type === 'dine-in' ? `Table ${kot.tableNumber}` : kot.type}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {isValidDate(kot.createdAt) ? parseDateTime(kot.createdAt).toLocaleTimeString() : 'Invalid Time'}
                  </span>
                </div>
                
                <div className="space-y-2 mb-3">
                  {kot.items.map((item) => {
                    const menuItem = state.menuItems.find(mi => mi.id === item.menuItemId);
                    return (
                      <div key={item.id} className="flex justify-between">
                        <span className="text-sm">{menuItem?.name}</span>
                        <span className="text-sm font-medium">×{item.quantity}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-green-100 text-green-800 py-2 px-3 rounded-lg text-center text-sm font-medium">
                  Ready for Pickup
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}