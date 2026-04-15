# Troubleshooting Guide

## 🔧 Common Issues and Solutions

### 1. MongoDB Connection Errors

#### Error: "MongoDB connection error"
**Solution:**
1. Make sure MongoDB is running:
   ```bash
   # Windows
   net start MongoDB
   
   # Mac/Linux
   sudo systemctl start mongod
   # or
   mongod
   ```

2. Check your `.env` file in the `backend` folder:
   ```env
   MONGODB_URI=mongodb://localhost:27017/contract-farming
   ```

3. If using MongoDB Atlas, use the connection string:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/contract-farming
   ```

4. Clear MongoDB and restart:
   ```bash
   cd backend
   npm run clear-db
   ```

### 2. Crops Not Loading

#### Issue: Marketplace shows "No crops found"
**Solutions:**

1. **Check if crops exist in database:**
   - Make sure you have created crops as a farmer
   - Crops must have `status: 'available'` to show in marketplace

2. **Check backend server:**
   - Ensure backend is running on port 5000
   - Check browser console for API errors
   - Verify CORS is enabled

3. **Check API endpoint:**
   - Open browser DevTools → Network tab
   - Look for `/api/crops` request
   - Check if it returns 200 status

4. **Test API directly:**
   ```bash
   curl http://localhost:5000/api/crops
   ```

5. **Create a test crop:**
   - Register as a farmer
   - Go to Farmer Dashboard
   - Click "Add New Crop"
   - Fill in the form and submit

### 3. Admin Dashboard Access

#### Issue: Cannot access admin dashboard
**Solution:**

1. **Create an admin user:**
   ```bash
   cd backend
   npm run create-admin
   ```
   
   This creates an admin with:
   - Email: `admin@contractfarming.com`
   - Password: `Admin@123`
   - ⚠️ **Change password after first login!**

2. **Login as admin:**
   - Go to `/login`
   - Use the admin credentials
   - You'll be redirected to `/admin/dashboard`

3. **Manual admin creation (if script doesn't work):**
   - Connect to MongoDB
   - Insert a user document with `role: 'admin'`
   ```javascript
   db.users.insertOne({
     name: "Admin User",
     email: "admin@contractfarming.com",
     password: "$2a$10$...", // bcrypt hash of password
     role: "admin",
     phone: "1234567890",
     isVerified: true,
     isActive: true
   })
   ```

### 4. Authentication Issues

#### Issue: "Not authorized" errors
**Solutions:**

1. **Check JWT_SECRET in .env:**
   ```env
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   ```

2. **Clear browser localStorage:**
   - Open DevTools → Application → Local Storage
   - Delete the `token` key
   - Refresh and login again

3. **Check token expiration:**
   - Default is 7 days
   - If expired, login again

### 5. Payment Integration Errors

#### Issue: Razorpay payment fails
**Solutions:**

1. **Use test keys for development:**
   - Get test keys from Razorpay dashboard
   - Add to `.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxx
   RAZORPAY_KEY_SECRET=xxxxx
   ```

2. **For testing without Razorpay:**
   - The payment flow will work but won't process real payments
   - You can mock the payment verification

### 6. CORS Errors

#### Error: "Access to fetch blocked by CORS policy"
**Solution:**

1. Check `backend/server.js` has:
   ```javascript
   app.use(cors());
   ```

2. If frontend is on different port, update CORS:
   ```javascript
   app.use(cors({
     origin: 'http://localhost:3000',
     credentials: true
   }));
   ```

### 7. Port Already in Use

#### Error: "Port 5000 already in use"
**Solutions:**

1. **Change port in .env:**
   ```env
   PORT=5001
   ```

2. **Kill process using port:**
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   
   # Mac/Linux
   lsof -ti:5000 | xargs kill
   ```

### 8. Frontend Build Errors

#### Error: Module not found
**Solutions:**

1. **Reinstall dependencies:**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Check Node.js version:**
   - Requires Node.js v16 or higher
   ```bash
   node --version
   ```

### 9. Database Connection Timeout

#### Error: "MongooseServerSelectionError"
**Solutions:**

1. **Check MongoDB is accessible:**
   ```bash
   mongosh
   # or
   mongo
   ```

2. **For MongoDB Atlas:**
   - Whitelist your IP address
   - Check connection string format
   - Verify username/password

3. **Increase timeout:**
   ```javascript
   mongoose.connect(uri, {
     serverSelectionTimeoutMS: 5000,
     socketTimeoutMS: 45000,
   });
   ```

### 10. Environment Variables Not Loading

#### Issue: process.env variables are undefined
**Solutions:**

1. **Check .env file location:**
   - Must be in `backend/` folder
   - File name must be exactly `.env` (not `.env.txt`)

2. **Restart server after .env changes:**
   ```bash
   # Stop server (Ctrl+C)
   # Start again
   npm run dev
   ```

3. **Verify dotenv is installed:**
   ```bash
   cd backend
   npm list dotenv
   ```

## 🧪 Testing Checklist

1. ✅ MongoDB is running
2. ✅ Backend server starts without errors
3. ✅ Frontend server starts without errors
4. ✅ Can register as farmer
5. ✅ Can register as buyer
6. ✅ Can create admin user
7. ✅ Can login with all roles
8. ✅ Can access respective dashboards
9. ✅ Can list crops (farmer)
10. ✅ Can view marketplace (buyer)
11. ✅ Can create contracts
12. ✅ Can make payments

## 📞 Still Having Issues?

1. Check browser console for errors
2. Check backend terminal for error logs
3. Verify all environment variables are set
4. Ensure MongoDB is running and accessible
5. Clear browser cache and localStorage
6. Restart both frontend and backend servers

## 🔍 Debug Commands

```bash
# Check MongoDB connection
mongosh mongodb://localhost:27017/contract-farming

# View all collections
show collections

# View users
db.users.find().pretty()

# View crops
db.crops.find().pretty()

# View contracts
db.contracts.find().pretty()

# Clear all data (careful!)
npm run clear-db
```





