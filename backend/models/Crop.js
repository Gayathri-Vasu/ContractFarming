const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please provide crop name'],
    trim: true
  },
  category: {
    type: String,
    enum: ['cereals', 'pulses', 'vegetables', 'fruits', 'spices', 'oilseeds', 'others', 'millets', 'flower'],
    required: true
  },
  quantity: {
    type: Number,
    required: [true, 'Please provide quantity'],
    min: 0
  },
  unit: {
    type: String,
    enum: ['kg', 'quintal', 'ton', 'acre'],
    default: 'kg'
  },
  quality: {
    type: String,
    enum: ['organic', 'premium', 'standard', 'grade-a', 'grade-b'],
    default: 'standard'
  },
  expectedPrice: {
    type: Number,
    required: [true, 'Please provide expected price per unit'],
    min: 0
  },
  harvestDate: {
    type: Date,
    required: [true, 'Please provide harvest date']
  },
  // String (legacy) or { en, ta, kn, te, ur }
  description: {
    type: mongoose.Schema.Types.Mixed
  },
  images: [{
    type: String
  }],
  location: {
    city: String,
    state: String,
    pincode: String,
    fullAddress: String
  },
  status: {
    type: String,
    enum: ['available', 'contracted', 'harvested', 'sold', 'expired'],
    default: 'available'
  },
  showInMarketplace: {
    type: Boolean,
    default: false
  },
  removedFromFarmerCircle: {
    type: Boolean,
    default: false
  },
  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for search optimization
cropSchema.index({ name: 'text', description: 'text' });
cropSchema.index({ status: 1, harvestDate: 1 });

module.exports = mongoose.model('Crop', cropSchema);
