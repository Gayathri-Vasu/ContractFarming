const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const users = [
  {
    name: 'Farmer Kumar',
    email: 'farmer@gmail.com',
    password: 'farmer123',
    phone: '9876543210',
    role: 'farmer',
    farmSize: 5.5,
    address: {
      street: 'Farm Road, Village',
      city: 'Erode',
      state: 'Tamil Nadu',
      pincode: '638001',
      country: 'India'
    }
  },
  {
    name: 'Buyer Singh',
    email: 'buyer@gmail.com',
    password: 'buyer123',
    phone: '9876543211',
    role: 'buyer',
    businessName: 'Agri Traders Pvt Ltd',
    businessType: 'retailer',
    address: {
      street: 'Market Street',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',
      country: 'India'
    }
  },
  {
    name: 'Admin',
    email: 'admin@gmail.com',
    password: 'admin123',
    phone: '1234567890',
    role: 'admin',
    isVerified: true,
    address: {
      street: 'Admin Block',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',
      country: 'India'
    }
  }
];

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/contract-farming')
  .then(async () => {
    console.log('MongoDB connected');
    console.log('Creating/updating 3 users (Farmer, Buyer, Admin)...\n');

    for (const userData of users) {
      try {
        let user = await User.findOne({ email: userData.email });
        if (user) {
          user.name = userData.name;
          user.phone = userData.phone;
          user.role = userData.role;
          user.address = userData.address;
          if (userData.role === 'farmer') user.farmSize = userData.farmSize;
          if (userData.role === 'buyer') {
            user.businessName = userData.businessName;
            user.businessType = userData.businessType;
          }
          if (userData.isVerified) user.isVerified = true;
          user.password = userData.password;
          await user.save();
          console.log(`✅ Updated: ${userData.role} (${userData.email})`);
        } else {
          await User.create(userData);
          console.log(`✅ Created: ${userData.role} (${userData.email})`);
        }
      } catch (err) {
        console.error(`❌ Error with ${userData.email}:`, err.message);
      }
    }

    console.log('\n--- User Credentials ---');
    users.forEach(u => {
      console.log(`${u.role}: ${u.email} / ${u.password}`);
    });
    console.log('\n✅ Seed complete. Use these to login.');
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
