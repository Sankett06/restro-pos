import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Grid3x3,
  Menu,
  Calendar,
  ShoppingCart,
  FileText,
  ChefHat,
  TrendingUp,
  LogOut,
  MenuIcon,
  X,
  Building2,
  Settings,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const getMenuItemsForRole = (role: string) => {
  const baseItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['super_admin', 'admin', 'manager', 'staff'] },
    { name: 'New Order', icon: FileText, path: '/new-order', roles: ['super_admin', 'admin', 'manager', 'staff'] },
    { name: 'Orders', icon: ShoppingCart, path: '/orders', roles: ['super_admin', 'admin', 'manager', 'staff'] },
    { name: 'Kitchen', icon: ChefHat, path: '/kitchen', roles: ['super_admin', 'admin', 'manager', 'staff'] },
    { name: 'Tables', icon: Grid3x3, path: '/tables', roles: ['super_admin', 'admin', 'manager', 'staff'] },
    { name: 'Menu Items', icon: Menu, path: '/menu', roles: ['super_admin', 'admin', 'manager'] },
    { name: 'Reservations', icon: Calendar, path: '/reservations', roles: ['super_admin', 'admin', 'manager', 'staff'] },
    { name: 'Staff', icon: UserCheck, path: '/staff', roles: ['super_admin', 'admin', 'manager'] },
    { name: 'Users', icon: Users, path: '/users', roles: ['super_admin', 'admin'] },
    { name: 'Restaurants', icon: Building2, path: '/restaurants', roles: ['super_admin'] },
    { name: 'Reports', icon: TrendingUp, path: '/reports', roles: ['super_admin', 'admin', 'manager'] },
  ];

  return baseItems.filter(item => item.roles.includes(role));
};

export default function Sidebar() {
  const location = useLocation();
  const { state, dispatch } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = getMenuItemsForRole(state.currentUser?.role || 'staff');

  const handleLogout = () => {
    dispatch({ type: 'SET_USER', payload: null });
    dispatch({ type: 'SET_CURRENT_RESTAURANT', payload: null });
  };

  const handleSwitchRestaurant = () => {
    dispatch({ type: 'SET_CURRENT_RESTAURANT', payload: null });
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-lg shadow-md"
      >
        <MenuIcon className="h-6 w-6 text-gray-600" />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div className={`
        bg-white shadow-lg flex flex-col transition-transform duration-300 ease-in-out
        fixed lg:relative inset-y-0 left-0 z-50
        w-64 lg:w-64
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 sm:p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-emerald-600">RestaurantPOS</h1>
              {state.currentUser && (
                <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                  {state.currentUser.name}
                </p>
              )}
              {state.currentRestaurant && (
                <p className="text-xs text-emerald-600 font-medium truncate">
                  {state.currentRestaurant.name}
                </p>
              )}
            </div>
            <button
              onClick={closeMobileMenu}
              className="lg:hidden p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={closeMobileMenu}
                className={`flex items-center px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-600 border-r-2 border-emerald-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
        
        {/* Footer */}
        <div className="p-3 sm:p-4 border-t space-y-2">
          {state.currentRestaurant && (state.currentUser?.role === 'super_admin' || state.currentUser?.role === 'admin') && (
            <button
              onClick={() => {
                handleSwitchRestaurant();
                closeMobileMenu();
              }}
              className="flex items-center px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors w-full"
            >
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
              <span>Switch Restaurant</span>
            </button>
          )}
          <button
            onClick={() => {
              handleLogout();
              closeMobileMenu();
            }}
            className="flex items-center px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full"
          >
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}