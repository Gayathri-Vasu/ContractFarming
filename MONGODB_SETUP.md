# MongoDB Setup Guide

## 🚀 Quick Start - MongoDB on Windows

### Option 1: Start MongoDB Service (Recommended)

**If MongoDB is installed as a Windows Service:**

1. **Open Command Prompt as Administrator:**
   - Press `Win + X`
   - Select "Windows PowerShell (Admin)" or "Command Prompt (Admin)"

2. **Start MongoDB Service:**
   ```bash
   net start MongoDB
   ```

3. **Verify it's running:**
   ```bash
   net start | findstr MongoDB
   ```
   Should show: `MongoDB`

4. **Test connection:**
   ```bash
   mongosh
   ```
   Or if mongosh is not available:
   ```bash
   mongo
   ```

### Option 2: Start MongoDB Manually

**If MongoDB is installed but not as a service:**

1. **Find MongoDB installation:**
   - Usually at: `C:\Program Files\MongoDB\Server\<version>\bin\`

2. **Start MongoDB:**
   ```bash
   cd "C:\Program Files\MongoDB\Server\<version>\bin"
   mongod.exe --dbpath "C:\data\db"
   ```

   **Note:** Create the data directory first:
   ```bash
   mkdir C:\data\db
   ```

### Option 3: Install MongoDB (If Not Installed)

1. **Download MongoDB:**
   - Visit: https://www.mongodb.com/try/download/community
   - Select Windows version
   - Download MSI installer

2. **Install MongoDB:**
   - Run the installer
   - Choose "Complete" installation
   - Select "Install MongoDB as a Service"
   - Use default settings

3. **Verify Installation:**
   ```bash
   mongod --version
   mongosh --version
   ```

### Option 4: Use MongoDB Atlas (Cloud - Free)

**Best option if you don't want to install MongoDB locally:**

1. **Sign up for free:**
   - Visit: https://www.mongodb.com/cloud/atlas/register

2. **Create a cluster:**
   - Choose FREE tier (M0)
   - Select region closest to you
   - Create cluster (takes 3-5 minutes)

3. **Get connection string:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password
   - Replace `<username>` with your database username

4. **Update .env file:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/contract-farming?retryWrites=true&w=majority
   ```

5. **Whitelist your IP:**
   - In Atlas dashboard → Network Access
   - Add your current IP address
   - Or add `0.0.0.0/0` for all IPs (less secure, but easier for development)

## 🔧 Troubleshooting

### Error: "MongoDB service is not running"

**Solution:**
```bash
# Start the service
net start MongoDB

# If that doesn't work, check if service exists
sc query MongoDB

# If service doesn't exist, install MongoDB as service
# Or use MongoDB Atlas instead
```

### Error: "Cannot connect to MongoDB"

**Check:**
1. Is MongoDB running?
   ```bash
   net start | findstr MongoDB
   ```

2. Is port 27017 available?
   ```bash
   netstat -ano | findstr :27017
   ```

3. Check MongoDB logs:
   - Usually at: `C:\Program Files\MongoDB\Server\<version>\log\mongod.log`

### Error: "Access denied"

**Solution:**
- Run Command Prompt as Administrator
- Or check MongoDB user permissions

### Error: "Port 27017 already in use"

**Solution:**
1. Find what's using the port:
   ```bash
   netstat -ano | findstr :27017
   ```

2. Kill the process (replace PID with actual process ID):
   ```bash
   taskkill /PID <PID> /F
   ```

3. Or change MongoDB port in config file

## ✅ Verify MongoDB is Running

**Test 1: Check Service Status**
```bash
sc query MongoDB
```

**Test 2: Connect via mongosh**
```bash
mongosh
# or
mongo
```

**Test 3: Connect to specific database**
```bash
mongosh mongodb://localhost:27017/contract-farming
```

**Test 4: Check from Node.js**
```bash
cd backend
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://localhost:27017/contract-farming').then(() => console.log('Connected!')).catch(err => console.error('Error:', err));"
```

## 🎯 Recommended Setup for Development

**For quick setup, use MongoDB Atlas (Cloud):**
- ✅ No installation needed
- ✅ Works on any OS
- ✅ Free tier available
- ✅ Easy to share with team
- ✅ Automatic backups

**Steps:**
1. Sign up at mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update `.env` file
5. Done!

## 📝 Update Your .env File

**For Local MongoDB:**
```env
MONGODB_URI=mongodb://localhost:27017/contract-farming
```

**For MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/contract-farming?retryWrites=true&w=majority
```

## 🚨 Quick Fix Script

Create `start-mongodb.bat` file:

```batch
@echo off
echo Starting MongoDB...
net start MongoDB
if %errorlevel% equ 0 (
    echo MongoDB started successfully!
) else (
    echo Failed to start MongoDB. Trying manual start...
    echo Please check if MongoDB is installed.
    pause
)
```

Run it by double-clicking or:
```bash
start-mongodb.bat
```





