import React, { useState } from 'react';
import { Lock, Mail, LogIn } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('admin@grandbistro.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { state, dispatch } = useApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiService.login(email, password);
      dispatch({ type: 'SET_USER', payload: response.user });
      
      // Load user's restaurants
      const restaurants = await apiService.getRestaurants();
      dispatch({ type: 'LOAD_RESTAURANTS', payload: restaurants });
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle different types of errors
      if (error.message.includes('Unable to connect')) {
        setError('Unable to connect to server. Please check your internet connection and try again.');
      } else if (error.message.includes('Authentication failed') || error.message.includes('Invalid credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (error.message.includes('Server error')) {
        setError('Server is temporarily unavailable. Please try again in a moment.');
      } else {
        setError(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="bg-emerald-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <LogIn className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600 text-sm sm:text-base">Sign in to your Restaurant POS account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="h-4 w-4 sm:h-5 sm:w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-600 text-white py-2 sm:py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 text-sm sm:text-base"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Demo Credentials:</p>
          <div className="space-y-1 text-xs text-gray-500">
            <p>Admin: admin@restaurant.com / admin123</p>
            <p>Manager: manager@restaurant.com / manager123</p>
            <p>Staff: staff@restaurant.com / staff123</p>
          </div>
        </div>
      </div>
    </div>
  );
}