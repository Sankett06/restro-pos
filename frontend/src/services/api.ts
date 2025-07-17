const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://restro-pos.onrender.com/api';

// API utility functions
class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `Server error: ${response.status} ${response.statusText}` };
        }
        
        // Handle specific error cases
        if (response.status === 500) {
          throw new Error(errorData.error || 'Server error. Please try again later.');
        } else if (response.status === 401) {
          this.clearToken();
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. Insufficient permissions.');
        } else {
          throw new Error(errorData.error || `Request failed: ${response.status}`);
        }
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your connection.');
      }
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    try {
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      if (response.token) {
        this.setToken(response.token);
      }
      
      return response;
    } catch (error) {
      // Clear any existing token on login failure
      this.clearToken();
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      return await this.request('/auth/me');
    } catch (error) {
      // If user fetch fails, clear token
      this.clearToken();
      throw error;
    }
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Restaurant endpoints
  async getRestaurants() {
    return this.request('/restaurants');
  }

  async getRestaurant(id: string) {
    return this.request(`/restaurants/${id}`);
  }

  async createRestaurant(data: any) {
    return this.request('/restaurants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRestaurant(id: string, data: any) {
    return this.request(`/restaurants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRestaurant(id: string) {
    return this.request(`/restaurants/${id}`, {
      method: 'DELETE',
    });
  }

  // User endpoints
  async getUsers() {
    return this.request('/users');
  }

  async createUser(data: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Staff endpoints
  async getStaff() {
    return this.request('/staff');
  }

  async createStaff(data: any) {
    return this.request('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStaff(id: string, data: any) {
    return this.request(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteStaff(id: string) {
    return this.request(`/staff/${id}`, {
      method: 'DELETE',
    });
  }

  // Table endpoints
  async getTables() {
    return this.request('/tables');
  }

  async createTable(data: any) {
    return this.request('/tables', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTable(id: string, data: any) {
    return this.request(`/tables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTable(id: string) {
    return this.request(`/tables/${id}`, {
      method: 'DELETE',
    });
  }

  // Menu endpoints
  async getMenuItems() {
    return this.request('/menu');
  }

  async createMenuItem(data: any) {
    return this.request('/menu', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMenuItem(id: string, data: any) {
    return this.request(`/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMenuItem(id: string) {
    return this.request(`/menu/${id}`, {
      method: 'DELETE',
    });
  }

  // Order endpoints
  async getOrders(filters?: any) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/orders${params ? `?${params}` : ''}`);
  }

  async createOrder(data: any) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrderStatus(id: string, status: string) {
    return this.request(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Reservation endpoints
  async getReservations() {
    return this.request('/reservations');
  }

  async createReservation(data: any) {
    return this.request('/reservations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateReservation(id: string, data: any) {
    return this.request(`/reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteReservation(id: string) {
    return this.request(`/reservations/${id}`, {
      method: 'DELETE',
    });
  }

  // KOT endpoints
  async getKOTs() {
    return this.request('/kots');
  }

  async updateKOTStatus(id: string, status: string) {
    return this.request(`/kots/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Reports endpoints
  async getReports(filters?: any) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/reports${params ? `?${params}` : ''}`);
  }
}

export const apiService = new ApiService();
export default apiService;