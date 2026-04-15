const express = require('express');

const { body, validationResult } = require('express-validator');

const Crop = require('../models/Crop');

const { protect, authorize } = require('../middleware/auth');

const { stringToI18nOrEmpty } = require('../services/translateService');



const router = express.Router();



// @route   GET /api/crops

// @desc    Get all available crops (with filters)

// @access  Public

router.get('/', async (req, res) => {

  try {

    const { category, status, search, minPrice, maxPrice, state, city } = req.query;

    

    // Build query - don't filter by status if status is explicitly provided
    let query = { removedFromFarmerCircle: { $ne: true } };
    // Default to available if no status specified; if status==='all', do not filter by status
    const statusParam = String(status || '').toLowerCase();
    if (!statusParam) {
      query.status = 'available';
    } else if (statusParam !== 'all') {
      query.status = status;
    }
    // Hide items from marketplace unless explicitly requesting all
    if (statusParam !== 'all') {
      query.showInMarketplace = true;
    }



    if (category) query.category = category;

    if (state) query['location.state'] = state;

    if (city) query['location.city'] = city;

    

    // Handle price range

    if (minPrice || maxPrice) {

      query.expectedPrice = {};

      if (minPrice) query.expectedPrice.$gte = Number(minPrice);

      if (maxPrice) query.expectedPrice.$lte = Number(maxPrice);

    }

    

    // Handle text search - use regex if text index not available

    if (search) {

      query.$or = [

        { name: { $regex: search, $options: 'i' } },

        { description: { $regex: search, $options: 'i' } },

        { 'description.en': { $regex: search, $options: 'i' } }

      ];

    }



    const crops = await Crop.find(query)

      .populate('farmer', 'name email phone rating address')

      .sort({ createdAt: -1 });



    res.json({

      success: true,

      count: crops.length,

      data: crops

    });

  } catch (error) {

    console.error('Error fetching crops:', error);

    res.status(500).json({

      success: false,

      message: 'Server error',

      error: error.message

    });

  }

});



// @route   GET /api/crops/:id

// @desc    Get single crop by ID

// @access  Public

router.get('/:id', async (req, res) => {

  try {

    const crop = await Crop.findById(req.params.id)

      .populate('farmer', 'name email phone rating address farmSize cropsGrown');



    if (!crop) {

      return res.status(404).json({

        success: false,

        message: 'Crop not found'

      });

    }



    res.json({

      success: true,

      data: crop

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: 'Server error',

      error: error.message

    });

  }

});



// @route   POST /api/crops

// @desc    Create a new crop listing

// @access  Private (Farmer only)

router.post('/', protect, authorize('farmer'), [

  body('name').notEmpty().withMessage('Crop name is required'),

  body('category').isIn(['cereals', 'pulses', 'vegetables', 'fruits', 'spices', 'oilseeds', 'others', 'millets', 'flower']).withMessage('Invalid category'),

  body('quantity').isNumeric().withMessage('Quantity must be a number'),

  body('expectedPrice').isNumeric().withMessage('Expected price must be a number'),

  body('harvestDate').isISO8601().withMessage('Harvest date must be a valid date')

], async (req, res) => {

  try {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

      return res.status(400).json({ success: false, errors: errors.array() });

    }



    const cropData = {
      ...req.body,
      farmer: req.user.id,
      showInMarketplace: false
    };



    const crop = await Crop.create(cropData);



    res.status(201).json({

      success: true,

      data: crop

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: 'Server error',

      error: error.message

    });

  }

});



// @route   PUT /api/crops/:id

// @desc    Update crop listing

// @access  Private (Farmer only - owner)

router.put('/:id', protect, authorize('farmer'), async (req, res) => {

  try {

    let crop = await Crop.findById(req.params.id);



    if (!crop) {

      return res.status(404).json({

        success: false,

        message: 'Crop not found'

      });

    }



    // Check ownership

    if (crop.farmer.toString() !== req.user.id) {

      return res.status(403).json({

        success: false,

        message: 'Not authorized to update this crop'

      });

    }



    // Don't allow updates if crop is contracted

    if (crop.status === 'contracted' || crop.contractId) {

      return res.status(400).json({

        success: false,

        message: 'Cannot update crop that is already under contract'

      });

    }

    const { description, ...restBody } = req.body;
    let updatePayload = { ...restBody };
    if (Object.prototype.hasOwnProperty.call(req.body, 'description')) {
      const descriptionI18n = await stringToI18nOrEmpty(
        typeof description === 'string' ? description : ''
      );
      if (descriptionI18n !== undefined) {
        updatePayload.description = descriptionI18n;
      }
    }

    crop = await Crop.findByIdAndUpdate(req.params.id, updatePayload, {

      new: true,

      runValidators: true

    });



    res.json({

      success: true,

      data: crop

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: 'Server error',

      error: error.message

    });

  }

});



// @route   DELETE /api/crops/:id

// @desc    Delete crop listing

// @access  Private (Farmer only - owner)

router.delete('/:id', protect, authorize('farmer'), async (req, res) => {

  try {

    const crop = await Crop.findById(req.params.id);



    if (!crop) {

      return res.status(404).json({

        success: false,

        message: 'Crop not found'

      });

    }



    // Check ownership

    if (crop.farmer.toString() !== req.user.id) {

      return res.status(403).json({

        success: false,

        message: 'Not authorized to delete this crop'

      });

    }



    // Don't allow deletion if crop is contracted

    if (crop.status === 'contracted' || crop.contractId) {

      crop.removedFromFarmerCircle = true;

      await crop.save();

      return res.json({

        success: true,

        message: 'Crop removed from farmer circle; contract remains active'

      });

    }



    await crop.deleteOne();



    res.json({

      success: true,

      message: 'Crop deleted successfully'

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: 'Server error',

      error: error.message

    });

  }

});



// @route   GET /api/crops/farmer/my-crops

// @desc    Get all crops of logged-in farmer

// @access  Private (Farmer only)

router.get('/farmer/my-crops', protect, authorize('farmer'), async (req, res) => {

  try {

    const crops = await Crop.find({ farmer: req.user.id, removedFromFarmerCircle: { $ne: true } })

      .populate('contractId')

      .sort({ createdAt: -1 });



    res.json({

      success: true,

      count: crops.length,

      data: crops

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


