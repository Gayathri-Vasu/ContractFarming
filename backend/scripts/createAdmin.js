const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/contract-farming', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected');
  
  // Create admin user
  const adminData = {
    name: 'admin',
    email: 'admin@gmail.com',
    password: 'adminn', // Change this password after first login
    phone: '1234567890',
    role: 'admin',
    isVerified: true,
    address: {
      city: 'City',
      state: 'state',
      pincode: '000000',
      country: 'India'
    }
  };

  try {
    // Check if admin already exists
    let admin = await User.findOne({ email: adminData.email });
    
    if (admin) {
      // Update existing admin's password and details
      admin.name = adminData.name;
      admin.phone = adminData.phone;
      admin.role = 'admin';
      admin.isVerified = true;
      admin.address = adminData.address;
      admin.password = adminData.password;
      await admin.save();
      console.log('✅ Existing admin user updated!');
    } else {
      // Create admin user
      admin = await User.create(adminData);
      console.log('✅ Admin user created successfully!');
    }
    console.log('Email:', adminData.email);
    console.log('Password:', adminData.password);
    console.log('⚠️  Please change the password after first login!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});



