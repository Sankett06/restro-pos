import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { apiService } from './services/api';
import Layout from './components/Layout';
import Login from './components/Login';
import RestaurantSelector from './components/RestaurantSelector';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import Staff from './components/Staff';
import Tables from './components/Tables';
import MenuItems from './components/MenuItems';
import Reservations from './components/Reservations';
import Orders from './components/Orders';
import NewOrder from './components/NewOrder';
import Kitchen from './components/Kitchen';
import Reports from './components/Reports';
import Restaurants from './components/Restaurants';

function AppContent() {
  const { state, dispatch } = useApp();

  useEffect(() => {
    // Check for existing authentication
    const checkAuth = async () => {
      try {
        const user = await apiService.getCurrentUser();
        dispatch({ type: 'SET_USER', payload: user });
        
        // Load restaurants
        const restaurants = await apiService.getRestaurants();
        dispatch({ type: 'LOAD_RESTAURANTS', payload: restaurants });
        
        // Load users if super admin
        if (user.role === 'super_admin' || user.role === 'admin') {
          try {
            const users = await apiService.getUsers();
            dispatch({ type: 'LOAD_INITIAL_DATA', payload: { users } });
          } catch (error) {
            console.log('Failed to load users:', error);
          }
        }
      } catch (error) {
        // User not authenticated or server error, stay on login
        console.log('Authentication check failed:', error);
        // Clear any stale tokens
        apiService.clearToken();
      }
    };

    checkAuth();
  }, [dispatch]);

  useEffect(() => {
    // Load restaurant-specific data when restaurant is selected
    const loadRestaurantData = async () => {
      if (!state.currentRestaurant) return;

      try {
        const [staff, tables, menuItems, reservations, orders, kots] = await Promise.all([
          apiService.getStaff(),
          apiService.getTables(),
          apiService.getMenuItems(),
          apiService.getReservations(),
          apiService.getOrders(),
          apiService.getKOTs(),
        ]);

        dispatch({
          type: 'LOAD_INITIAL_DATA',
          payload: {
            staff,
            tables,
            menuItems,
            reservations,
            orders,
            kots,
          },
        });
      } catch (error) {
        console.error('Failed to load restaurant data:', error);
      }
    };

    loadRestaurantData();
  }, [state.currentRestaurant, dispatch]);

  // Filter data based on current restaurant
  const getFilteredData = () => {
    if (!state.currentRestaurant) return state;

    return {
      ...state,
      staff: state.staff.filter(s => s.restaurantId === state.currentRestaurant?.id),
      tables: state.tables.filter(t => t.restaurantId === state.currentRestaurant?.id),
      menuItems: state.menuItems.filter(m => m.restaurantId === state.currentRestaurant?.id),
      reservations: state.reservations.filter(r => r.restaurantId === state.currentRestaurant?.id),
      orders: state.orders.filter(o => o.restaurantId === state.currentRestaurant?.id),
      kots: state.kots.filter(k => k.restaurantId === state.currentRestaurant?.id),
    };
  };

  // Update context with filtered data
  const filteredState = getFilteredData();

  return (
    <Router>
      <Routes>
        {!state.currentUser ? (
          <Route path="*" element={<Login />} />
        ) : !state.currentRestaurant ? (
          <Route path="*" element={<RestaurantSelector />} />
        ) : (
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/tables" element={<Tables />} />
            <Route path="/menu" element={<MenuItems />} />
            <Route path="/reservations" element={<Reservations />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/new-order" element={<NewOrder />} />
            <Route path="/kitchen" element={<Kitchen />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/restaurants" element={<Restaurants />} />
          </Route>
        )}
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;