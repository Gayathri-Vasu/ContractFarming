const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Crop = require('../models/Crop');

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/contract-farming';

const run = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');

    // Ensure a sample farmer exists
    const farmerEmail = 'farmer@gmail.com';
    let farmer = await User.findOne({ email: farmerEmail });

    if (!farmer) {
      console.log('Creating sample farmer user...');
      farmer = await User.create({
        name: 'Sample Farmer',
        email: farmerEmail,
        password: 'farmer', // simple password for demo
        phone: '9999999999',
        role: 'farmer',
        isVerified: true,
        address: {
          city: 'Demo Village',
          state: 'Demo State',
          pincode: '123456',
          country: 'India',
        },
        farmSize: 5,
      });
    } else {
      console.log('Sample farmer already exists:', farmerEmail);
    }

    // Remove existing demo crops for this farmer
    await Crop.deleteMany({ farmer: farmer._id });

    console.log('Seeding sample crops...');
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in45Days = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    const crops = await Crop.insertMany([
      {
        farmer: farmer._id,
        name: 'Wheat',
        category: 'cereals',
        quantity: 1000,
        unit: 'kg',
        quality: 'standard',
        expectedPrice: 25,
        harvestDate: in30Days,
        description: 'High-quality wheat suitable for flour mills.',
        location: {
          city: 'Demo Village',
          state: 'Demo State',
          pincode: '123456',
        },
      },
      {
        farmer: farmer._id,
        name: 'Tomato',
        category: 'vegetables',
        quantity: 500,
        unit: 'kg',
        quality: 'premium',
        expectedPrice: 35,
        harvestDate: in45Days,
        description: 'Fresh red tomatoes, ideal for retail and processing.',
        location: {
          city: 'Demo Village',
          state: 'Demo State',
          pincode: '123456',
        },
      },
      {
        farmer: farmer._id,
        name: 'Basmati Rice',
        category: 'cereals',
        quantity: 2000,
        unit: 'kg',
        quality: 'premium',
        expectedPrice: 80,
        harvestDate: in60Days,
        description: 'Aromatic basmati rice suitable for export.',
        location: {
          city: 'Demo Village',
          state: 'Demo State',
          pincode: '123456',
        },
      },
    ]);

    console.log(`✅ Seeded ${crops.length} crops for farmer ${farmerEmail}`);
    console.log('You can now see them in the Marketplace page.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding crops:', err);
    process.exit(1);
  }
};

run();




