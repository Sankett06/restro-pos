import React from 'react';
import { KOT } from '../types';
import { useApp } from '../context/AppContext';
import { format } from 'date-fns';
import { parseDateTime, isValidDate } from '../utils/dateUtils';

interface PrintableKOTProps {
  kot: KOT;
  onClose: () => void;
}

export default function PrintableKOT({ kot, onClose }: PrintableKOTProps) {
  const { state } = useApp();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-sm w-full max-h-[90vh] overflow-y-auto">
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
              font-size: 14px;
              line-height: 1.4;
              font-weight: bold;
            }
          }
        `}</style>

        {/* KOT Content */}
        <div className="print-area p-4">
          {/* KOT Header */}
          <div className="text-center border-b-2 border-gray-800 pb-3 mb-4">
            <h1 className="text-xl font-bold">KITCHEN ORDER TICKET</h1>
            <h2 className="text-lg font-semibold">RestaurantPOS</h2>
          </div>

          {/* Order Info */}
          <div className="mb-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold">KOT #:</span>
              <span className="font-bold text-lg">{kot.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{isValidDate(kot.createdAt) ? format(parseDateTime(kot.createdAt), 'dd/MM/yyyy') : 'Invalid Date'}</span>
            </div>
            <div className="flex justify-between">
              <span>Time:</span>
              <span className="font-bold">{isValidDate(kot.createdAt) ? format(parseDateTime(kot.createdAt), 'HH:mm:ss') : 'Invalid Time'}</span>
            </div>
            <div className="flex justify-between">
              <span>Type:</span>
              <span className="font-bold uppercase">{kot.type}</span>
            </div>
            {kot.tableNumber && (
              <div className="flex justify-between">
                <span>Table:</span>
                <span className="font-bold text-lg">#{kot.tableNumber}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="mb-4">
            <h3 className="font-bold text-center border-b border-gray-400 pb-2 mb-3">
              ITEMS TO PREPARE
            </h3>
            <div className="space-y-3">
              {kot.items.map((item, index) => {
                const menuItem = state.menuItems.find(mi => mi.id === item.menuItemId);
                return (
                  <div key={item.id} className="border-b border-gray-200 pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-bold text-lg">{menuItem?.name || 'Unknown Item'}</p>
                        {menuItem?.category && (
                          <p className="text-sm text-gray-600">({menuItem.category})</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-xl">×{item.quantity}</span>
                      </div>
                    </div>
                    {item.specialInstructions && (
                      <div className="mt-2 p-2 bg-yellow-100 rounded">
                        <p className="text-sm font-bold">SPECIAL INSTRUCTIONS:</p>
                        <p className="text-sm">{item.specialInstructions}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority Status */}
          <div className="mb-4 p-3 bg-red-100 border-2 border-red-500 rounded text-center">
            <p className="font-bold text-red-800">STATUS: {kot.status.toUpperCase()}</p>
            {kot.status === 'pending' && (
              <p className="text-sm text-red-700 mt-1">⚠️ URGENT - START PREPARATION</p>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-sm border-t-2 border-gray-800 pt-3">
            <p className="font-bold">Kitchen Copy</p>
            <p>Please update status when ready</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="no-print flex justify-end space-x-3 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Print KOT
          </button>
        </div>
      </div>
    </div>
  );
}