const mongoose = require('mongoose');

const marketplaceProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide crop name'],
    trim: true,
    unique: true
  },
  category: {
    type: String,
    enum: ['grain', 'vegetable', 'fruit', 'pulse', 'oilseed', 'spice'],
    required: [true, 'Please provide category']
  },
  pricePerKg: {
    type: Number,
    required: [true, 'Please provide price per kg'],
    min: [0, 'Price cannot be negative']
  },
  unit: {
    type: String,
    enum: ['kg', 'quintal', 'ton'],
    default: 'kg'
  },
  season: {
    type: String,
    enum: ['kharif', 'rabi', 'zaid', 'all-year'],
    required: [true, 'Please provide season']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
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
marketplaceProductSchema.index({ name: 'text', description: 'text' });
marketplaceProductSchema.index({ category: 1, isActive: 1 });
marketplaceProductSchema.index({ season: 1 });

// Update updatedAt before saving
marketplaceProductSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('MarketplaceProduct', marketplaceProductSchema);
