import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Header() {
  const { state } = useApp();

  return (
    <header className="bg-white shadow-sm border-b px-4 sm:px-6 py-3 sm:py-4 ml-0 lg:ml-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {/* Search - Hidden on mobile, shown on larger screens */}
          <div className="relative hidden sm:block flex-1 max-w-md">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-8 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-full text-sm"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Search icon for mobile */}
          <button className="sm:hidden p-2 text-gray-600 hover:text-emerald-600 transition-colors">
            <Search className="h-5 w-5" />
          </button>

          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-emerald-600 transition-colors">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-3 w-3 sm:h-4 sm:w-4 flex items-center justify-center text-[10px] sm:text-xs">
              3
            </span>
          </button>
          
          {/* User Profile */}
          <div className="flex items-center space-x-2">
            <div className="bg-emerald-100 p-1.5 sm:p-2 rounded-full">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                {state.currentUser?.name || 'Guest'}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {state.currentUser?.role || 'Guest'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}