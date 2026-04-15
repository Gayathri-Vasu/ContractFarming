const express = require('express');
const MarketPrice = require('../models/MarketPrice');
const { fetchAndStoreMarketPrices } = require('../services/marketPriceService');

const router = express.Router();

// @route   GET /api/market-prices
// @desc    Get latest market prices (with background sync)
// @access  Public
router.get('/', async (req, res) => {
  try {
    try {
      await fetchAndStoreMarketPrices();
    } catch (syncError) {
      // Non-blocking: still return last successful data from DB.
      console.error('Market price sync failed:', syncError.message);
    }

    const data = await MarketPrice.find({})
      .sort({ date: -1, updatedAt: -1 })
      .limit(50)
      .lean();

    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load market prices',
      error: error.message
    });
  }
});

module.exports = router;
