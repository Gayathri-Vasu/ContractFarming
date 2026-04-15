# Quick Setup Guide

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 2: Setup Environment Variables

Create `backend/.env` file:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/contract-farming
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
EMAIL_FROM_NAME=Contract Farming System
```

### Step 3: Start MongoDB

**Windows:**
```bash
net start MongoDB
```

**Mac/Linux:**
```bash
sudo systemctl start mongod
# or
mongod
```

### Step 4: Create Admin User

```bash
cd backend
npm run create-admin
```

This creates:
- Email: `admin@contractfarming.com`
- Password: `Admin@123`

### Step 5: Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 6: Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 👤 Test Accounts

### Admin
- Email: `admin@contractfarming.com`
- Password: `Admin@123`
- URL: http://localhost:3000/admin/dashboard

### Create Farmer Account
1. Go to http://localhost:3000/register
2. Select "Farmer" role
3. Fill in details and register
4. Login and access dashboard

### Create Buyer Account
1. Go to http://localhost:3000/register
2. Select "Buyer" role
3. Fill in business details
4. Login and access dashboard

## 🔧 Common Commands

```bash
# Create admin user
cd backend && npm run create-admin

# Clear database (careful!)
cd backend && npm run clear-db

# Check MongoDB connection
mongosh mongodb://localhost:27017/contract-farming
```

## ✅ Verification Steps

1. ✅ Backend runs on port 5000
2. ✅ Frontend runs on port 3000
3. ✅ Can register new users
4. ✅ Can login with admin account
5. ✅ Can access admin dashboard
6. ✅ Can create crops (as farmer)
7. ✅ Can view marketplace
8. ✅ Can create contracts (as buyer)





