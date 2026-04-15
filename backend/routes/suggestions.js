const express = require('express');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/suggestions/register
// @desc    Get auto-suggestion values for registration form based on existing users
// @access  Public
router.get('/register', async (req, res) => {
  try {
    const [cities, states, pincodes, businessNames, farmSizes] = await Promise.all([
      User.distinct('address.city', { 'address.city': { $nin: [null, ''] } }),
      User.distinct('address.state', { 'address.state': { $nin: [null, ''] } }),
      User.distinct('address.pincode', { 'address.pincode': { $nin: [null, ''] } }),
      User.distinct('businessName', { businessName: { $nin: [null, ''] } }),
      User.distinct('farmSize', { farmSize: { $ne: null } })
    ]);

    res.json({
      success: true,
      data: {
        cities,
        states,
        pincodes,
        businessNames,
        // Convert numeric farm sizes to strings for nicer display
        farmSizes: (farmSizes || []).map((v) =>
          typeof v === 'number' ? v.toString() : String(v)
        ),
      },
    });
  } catch (error) {
    console.error('Error fetching registration suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load registration suggestions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

module.exports = router;

