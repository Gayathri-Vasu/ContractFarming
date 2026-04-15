const express = require('express');
const { body, validationResult } = require('express-validator');
const MarketplaceProduct = require('../models/MarketplaceProduct');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/marketplace
// @desc    Get all marketplace products (public - for marketplace display)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, season, search, minPrice, maxPrice } = req.query;
    
    // Build query - only show active products
    let query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    if (season) {
      query.season = season;
    }
    
    // Handle price range
    if (minPrice || maxPrice) {
      query.pricePerKg = {};
      if (minPrice) query.pricePerKg.$gte = Number(minPrice);
      if (maxPrice) query.pricePerKg.$lte = Number(maxPrice);
    }
    
    // Handle text search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await MarketplaceProduct.find(query)
      .sort({ name: 1 });

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error fetching marketplace products:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/marketplace/:id
// @desc    Get single marketplace product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await MarketplaceProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/marketplace
// @desc    Add new crop/product to marketplace
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Crop name is required'),
  body('category').isIn(['grain', 'vegetable', 'fruit', 'pulse', 'oilseed', 'spice']).withMessage('Invalid category'),
  body('pricePerKg').isNumeric().withMessage('Price per kg must be a number'),
  body('pricePerKg').isFloat({ min: 0 }).withMessage('Price cannot be negative'),
  body('season').isIn(['kharif', 'rabi', 'zaid', 'all-year']).withMessage('Invalid season'),
  body('unit').optional().isIn(['kg', 'quintal', 'ton']).withMessage('Invalid unit')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const product = await MarketplaceProduct.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Product added to marketplace successfully',
      data: product
    });
  } catch (error) {
    // Handle duplicate name error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product with this name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/marketplace/:id
// @desc    Update marketplace product (especially price)
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), [
  body('pricePerKg').optional().isNumeric().withMessage('Price per kg must be a number'),
  body('pricePerKg').optional().isFloat({ min: 0 }).withMessage('Price cannot be negative'),
  body('category').optional().isIn(['grain', 'vegetable', 'fruit', 'pulse', 'oilseed', 'spice']).withMessage('Invalid category'),
  body('season').optional().isIn(['kharif', 'rabi', 'zaid', 'all-year']).withMessage('Invalid season')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const product = await MarketplaceProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update product
    const updatedProduct = await MarketplaceProduct.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/marketplace/:id
// @desc    Soft delete marketplace product (set isActive to false)
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await MarketplaceProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Soft delete - set isActive to false
    product.isActive = false;
    await product.save();

    res.json({
      success: true,
      message: 'Product deactivated successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/marketplace/:id/activate
// @desc    Reactivate a deactivated product
// @access  Private (Admin only)
router.put('/:id/activate', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await MarketplaceProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.isActive = true;
    await product.save();

    res.json({
      success: true,
      message: 'Product activated successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
