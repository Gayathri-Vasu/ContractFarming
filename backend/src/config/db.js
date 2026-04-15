const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri =
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/assured_contract_farming';

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

