-- Seed data for Restaurant POS

USE restaurant_pos;

-- Insert sample restaurants
INSERT INTO restaurants (id, name, address, phone, email, gst_number, active, owner_id) VALUES
('rest-1', 'The Grand Bistro', '123 Main Street, Downtown, City 12345', '+1-555-0100', 'info@grandbistro.com', '22AAAAA0000A1Z5', TRUE, 'user-1'),
('rest-2', 'Coastal Kitchen', '456 Ocean Drive, Beachside, City 12346', '+1-555-0200', 'hello@coastalkitchen.com', '22BBBBB0000B1Z5', TRUE, 'user-1');

-- Insert sample users
INSERT INTO users (id, name, email, password, role, active, restaurant_id) VALUES
('user-1', 'Super Admin', 'superadmin@restaurantpos.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin', TRUE, NULL),
('user-2', 'Admin User', 'admin@grandbistro.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', TRUE, 'rest-1'),
('user-3', 'John Manager', 'manager@grandbistro.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager', TRUE, 'rest-1'),
('user-4', 'Jane Staff', 'staff@grandbistro.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff', TRUE, 'rest-1'),
('user-5', 'Coastal Admin', 'admin@coastalkitchen.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', TRUE, 'rest-2');

-- Insert sample staff
INSERT INTO staff (id, name, email, phone, role, salary, active, hire_date, restaurant_id) VALUES
('staff-1', 'Alice Johnson', 'alice@grandbistro.com', '+1-555-0101', 'manager', 50000.00, TRUE, '2024-01-01', 'rest-1'),
('staff-2', 'Bob Smith', 'bob@grandbistro.com', '+1-555-0102', 'waiter', 35000.00, TRUE, '2024-01-15', 'rest-1'),
('staff-3', 'Charlie Brown', 'charlie@grandbistro.com', '+1-555-0103', 'chef', 45000.00, TRUE, '2024-02-01', 'rest-1'),
('staff-4', 'Diana Ross', 'diana@grandbistro.com', '+1-555-0104', 'cashier', 32000.00, TRUE, '2024-02-15', 'rest-1'),
('staff-5', 'Eva Martinez', 'eva@coastalkitchen.com', '+1-555-0201', 'manager', 52000.00, TRUE, '2024-02-01', 'rest-2');

-- Insert sample tables
INSERT INTO tables (id, number, capacity, status, location, restaurant_id) VALUES
('table-1', 1, 4, 'available', 'Main Hall', 'rest-1'),
('table-2', 2, 2, 'available', 'Main Hall', 'rest-1'),
('table-3', 3, 6, 'available', 'Main Hall', 'rest-1'),
('table-4', 4, 4, 'available', 'Terrace', 'rest-1'),
('table-5', 5, 8, 'available', 'Private Room', 'rest-1'),
('table-6', 1, 4, 'available', 'Ocean View', 'rest-2'),
('table-7', 2, 6, 'available', 'Ocean View', 'rest-2');

-- Insert sample menu items
INSERT INTO menu_items (id, name, description, category, price, stock, available, restaurant_id) VALUES
('menu-1', 'Margherita Pizza', 'Fresh tomatoes, mozzarella, basil', 'Pizza', 18.99, 50, TRUE, 'rest-1'),
('menu-2', 'Caesar Salad', 'Romaine lettuce, parmesan, croutons', 'Salads', 12.99, 30, TRUE, 'rest-1'),
('menu-3', 'Grilled Salmon', 'Atlantic salmon with lemon butter', 'Seafood', 26.99, 20, TRUE, 'rest-1'),
('menu-4', 'Chicken Alfredo', 'Fettuccine pasta with creamy alfredo sauce', 'Pasta', 19.99, 25, TRUE, 'rest-1'),
('menu-5', 'Tiramisu', 'Classic Italian dessert', 'Desserts', 8.99, 15, TRUE, 'rest-1'),
('menu-6', 'Cappuccino', 'Espresso with steamed milk foam', 'Beverages', 4.99, 100, TRUE, 'rest-1'),
('menu-7', 'Fish Tacos', 'Fresh catch with coastal spices', 'Seafood', 16.99, 25, TRUE, 'rest-2'),
('menu-8', 'Coconut Shrimp', 'Crispy coconut-crusted shrimp', 'Appetizers', 14.99, 20, TRUE, 'rest-2');