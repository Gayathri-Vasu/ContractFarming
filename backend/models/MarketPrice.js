const mongoose = require('mongoose');

const marketPriceSchema = new mongoose.Schema(
  {
    cropName: {
      type: String,
      required: true,
      trim: true
    },
    market: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    minPrice: {
      type: Number,
      default: 0
    },
    maxPrice: {
      type: Number,
      default: 0
    },
    modalPrice: {
      type: Number,
      default: 0
    },
    date: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate records for the same crop, market, and date.
marketPriceSchema.index({ cropName: 1, market: 1, date: 1 }, { unique: true });
marketPriceSchema.index({ date: -1 });

module.exports = mongoose.model('MarketPrice', marketPriceSchema);
