-- Restaurant POS Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS restaurant_pos;
USE restaurant_pos;

-- Restaurants table
CREATE TABLE restaurants (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  gst_number VARCHAR(50),
  logo VARCHAR(500),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  owner_id VARCHAR(36) NOT NULL
);

-- Users table
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'admin', 'manager', 'staff') NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  restaurant_id VARCHAR(36),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE SET NULL
);

-- Staff table
CREATE TABLE staff (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  role ENUM('manager', 'waiter', 'chef', 'cashier') NOT NULL,
  salary DECIMAL(10, 2) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  hire_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  restaurant_id VARCHAR(36) NOT NULL,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Tables table
CREATE TABLE tables (
  id VARCHAR(36) PRIMARY KEY,
  number INT NOT NULL,
  capacity INT NOT NULL,
  status ENUM('available', 'occupied', 'reserved') DEFAULT 'available',
  location VARCHAR(255) NOT NULL,
  current_order_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  restaurant_id VARCHAR(36) NOT NULL,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  UNIQUE KEY unique_table_per_restaurant (restaurant_id, number)
);

-- Menu items table
CREATE TABLE menu_items (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  available BOOLEAN DEFAULT TRUE,
  image VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  restaurant_id VARCHAR(36) NOT NULL,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Reservations table
CREATE TABLE reservations (
  id VARCHAR(36) PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  table_id VARCHAR(36) NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  party_size INT NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
  special_requests TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  restaurant_id VARCHAR(36) NOT NULL,
  FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Orders table
CREATE TABLE orders (
  id VARCHAR(36) PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  type ENUM('dine-in', 'takeaway', 'delivery') NOT NULL,
  table_id VARCHAR(36),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_address TEXT,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL,
  service_charge DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'preparing', 'ready', 'served', 'delivered', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  staff_id VARCHAR(36) NOT NULL,
  restaurant_id VARCHAR(36) NOT NULL,
  FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE SET NULL,
  FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Order items table
CREATE TABLE order_items (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  menu_item_id VARCHAR(36) NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  special_instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT
);

-- KOTs table
CREATE TABLE kots (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  order_number VARCHAR(50) NOT NULL,
  table_number INT,
  type ENUM('dine-in', 'takeaway', 'delivery') NOT NULL,
  special_instructions TEXT,
  status ENUM('pending', 'preparing', 'ready') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  restaurant_id VARCHAR(36) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- KOT items table
CREATE TABLE kot_items (
  id VARCHAR(36) PRIMARY KEY,
  kot_id VARCHAR(36) NOT NULL,
  menu_item_id VARCHAR(36) NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  special_instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kot_id) REFERENCES kots(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT
);

-- Create indexes for better performance
CREATE INDEX idx_users_restaurant ON users(restaurant_id);
CREATE INDEX idx_staff_restaurant ON staff(restaurant_id);
CREATE INDEX idx_tables_restaurant ON tables(restaurant_id);
CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(created_at);
CREATE INDEX idx_reservations_restaurant ON reservations(restaurant_id);
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_kots_restaurant ON kots(restaurant_id);
CREATE INDEX idx_kots_status ON kots(status);