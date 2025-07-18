export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'staff';
  password: string;
  active: boolean;
  createdAt: Date;
  restaurantId?: string; // Optional for super_admin, required for others
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  gstNumber?: string;
  logo?: string;
  active: boolean;
  createdAt: Date;
  ownerId: string; // User ID of the owner
  currency: string; // Currency code (USD, INR, AED, etc.)
  currencySymbol: string; // Currency symbol ($, ₹, د.إ, etc.)
  updatedAt?: Date;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  position: 'before' | 'after'; // Symbol position relative to amount
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
}
export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'manager' | 'waiter' | 'chef' | 'cashier';
  salary: number;
  active: boolean;
  hireDate: Date;
  restaurantId: string;
}

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  location: string;
  currentOrderId?: string;
  restaurantId: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  available: boolean;
  image?: string;
  restaurantId: string;
}

export interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  email?: string;
  tableId: string;
  date: Date;
  time: string;
  partySize: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  specialRequests?: string;
  restaurantId: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  type: 'dine-in' | 'takeaway' | 'delivery';
  tableId?: string;
  customerInfo?: {
    name: string;
    phone: string;
    address?: string;
  };
  items: OrderItem[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  discount: number;
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'delivered' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  staffId: string;
  restaurantId: string;
}

export interface KOT {
  id: string;
  orderId: string;
  orderNumber: string;
  tableNumber?: number;
  type: 'dine-in' | 'takeaway' | 'delivery';
  items: OrderItem[];
  specialInstructions?: string;
  createdAt: Date;
  status: 'pending' | 'preparing' | 'ready';
  restaurantId: string;
}