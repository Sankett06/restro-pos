# Restaurant POS & Management System

A comprehensive Restaurant Point of Sale and Management System built with React, Node.js, Express, and MySQL.

## Features

### Core Modules
- **User Management**: Role-based access controls (Super Admin, Admin, Manager, Staff)
- **Multi-Restaurant Support**: Manage multiple restaurant locations
- **Staff Management**: Complete CRUD operations for staff members
- **Table Management**: Real-time table status tracking
- **Menu Management**: Item categorization, pricing, and stock management
- **Reservation System**: Table booking and customer management
- **Order Workflow**: Dine-in, takeaway, and delivery support
- **Kitchen Operations**: KOT (Kitchen Order Ticket) system
- **Billing System**: Professional invoice generation
- **Reports & Analytics**: Sales tracking and performance metrics

### Technical Features
- **Responsive Design**: Mobile, tablet, and desktop optimized
- **Real-time Updates**: Live order and table status updates
- **Print Support**: Bills and KOT printing functionality
- **Role-based Navigation**: Dynamic menu based on user permissions
- **Multi-tenant Architecture**: Restaurant-specific data isolation

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Lucide React** for icons
- **Date-fns** for date handling

### Backend
- **Node.js** with Express
- **MySQL** database
- **JWT** authentication
- **bcryptjs** for password hashing
- **CORS** and security middleware

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Database Setup

1. **Create MySQL Database**:
   ```sql
   CREATE DATABASE restaurant_pos;
   ```

2. **Run Database Schema**:
   ```bash
   mysql -u root -p restaurant_pos < server/migrations/schema.sql
   ```

3. **Insert Sample Data** (optional):
   ```bash
   mysql -u root -p restaurant_pos < server/migrations/seed.sql
   ```

### Backend Setup

1. **Navigate to server directory**:
   ```bash
   cd server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=restaurant_pos
   JWT_SECRET=your_super_secret_jwt_key
   ```

4. **Start the server**:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env`:
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

## Usage

### Default Login Credentials

**Super Admin**:
- Email: `superadmin@restaurantpos.com`
- Password: `admin123`

**Admin**:
- Email: `admin@grandbistro.com`
- Password: `admin123`

**Manager**:
- Email: `manager@grandbistro.com`
- Password: `manager123`

**Staff**:
- Email: `staff@grandbistro.com`
- Password: `staff123`

### Workflow Guide

1. **Login** with appropriate credentials
2. **Select Restaurant** (if multiple restaurants)
3. **Dashboard** - Overview of operations
4. **New Order** - Create orders for dine-in, takeaway, or delivery
5. **Kitchen** - Manage KOTs and order preparation
6. **Tables** - Monitor table status and availability
7. **Reports** - View analytics and performance metrics

## Database Schema

### Key Tables
- `restaurants` - Restaurant information
- `users` - System users with role-based access
- `staff` - Restaurant staff members
- `tables` - Table management
- `menu_items` - Food and beverage items
- `orders` - Customer orders
- `order_items` - Order line items
- `kots` - Kitchen order tickets
- `reservations` - Table reservations

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/change-password` - Change password

### Restaurants
- `GET /api/restaurants` - Get restaurants
- `POST /api/restaurants` - Create restaurant
- `PUT /api/restaurants/:id` - Update restaurant
- `DELETE /api/restaurants/:id` - Delete restaurant

### Orders
- `GET /api/orders` - Get orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update order status

### Additional endpoints available for all modules...

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Hierarchical permission system
- **Password Hashing**: bcrypt for secure password storage
- **CORS Protection**: Cross-origin request security
- **Rate Limiting**: API request throttling
- **Input Validation**: Server-side data validation

## Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secret
4. Enable HTTPS
5. Configure proper CORS origins

### Build Commands
```bash
# Frontend build
npm run build

# Backend start
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.