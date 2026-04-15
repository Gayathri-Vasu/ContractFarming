# 🚀 Quick Start - MongoDB Setup

## ⚡ Fastest Way: Use MongoDB Atlas (Cloud - FREE)

**No installation needed! Works in 5 minutes:**

1. **Sign up:** https://www.mongodb.com/cloud/atlas/register
2. **Create FREE cluster** (M0 tier)
3. **Get connection string:**
   - Click "Connect" → "Connect your application"
   - Copy the connection string
4. **Update `backend/.env`:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/contract-farming?retryWrites=true&w=majority
   ```
   (Replace username, password, and cluster URL)
5. **Whitelist IP:** In Atlas → Network Access → Add IP Address (or `0.0.0.0/0` for dev)
6. **Done!** Start your backend server

---

## 🪟 Windows: Start Local MongoDB

### If MongoDB is Already Installed:

**Option 1: Start as Service (Recommended)**
```bash
# Open Command Prompt as Administrator
net start MongoDB
```

**Option 2: Use the Batch Script**
```bash
# Double-click start-mongodb.bat
# Or run from command line:
start-mongodb.bat
```

**Option 3: Test Connection**
```bash
cd backend
npm run test-mongo
```

### If MongoDB is NOT Installed:

**Install MongoDB:**
1. Download: https://www.mongodb.com/try/download/community
2. Run installer
3. Choose "Complete" installation
4. ✅ Check "Install MongoDB as a Service"
5. Use default settings
6. After installation, MongoDB will start automatically

**Verify:**
```bash
net start | findstr MongoDB
```

---

## 🧪 Test Your Connection

**Test MongoDB connection:**
```bash
cd backend
npm run test-mongo
```

**Expected output if working:**
```
✅ SUCCESS! MongoDB is connected.
Host: localhost:27017
Database: contract-farming
```

**If it fails:**
- See error message for specific issue
- Check `MONGODB_SETUP.md` for detailed troubleshooting

---

## 📝 Update .env File

**For Local MongoDB:**
```env
MONGODB_URI=mongodb://localhost:27017/contract-farming
```

**For MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/contract-farming?retryWrites=true&w=majority
```

---

## ✅ Verify Everything Works

1. **Start MongoDB** (local or Atlas)
2. **Test connection:**
   ```bash
   cd backend
   npm run test-mongo
   ```
3. **Start backend:**
   ```bash
   npm run dev
   ```
4. **Check console** - should see:
   ```
   ✅ MongoDB connected successfully: localhost
   📊 Database: contract-farming
   Server running on port 5000
   ```

---

## 🆘 Still Having Issues?

1. **Check if MongoDB is running:**
   ```bash
   net start | findstr MongoDB
   ```

2. **Check connection:**
   ```bash
   cd backend
   npm run test-mongo
   ```

3. **Read detailed guide:**
   - See `MONGODB_SETUP.md` for complete instructions

4. **Use MongoDB Atlas instead:**
   - No installation needed
   - Free tier available
   - Works immediately

---

## 💡 Recommendation

**For development, use MongoDB Atlas:**
- ✅ No installation
- ✅ Works on any OS
- ✅ Free forever
- ✅ Easy setup
- ✅ No local configuration needed

**For production, use MongoDB Atlas or your own MongoDB server.**





