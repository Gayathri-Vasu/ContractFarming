const express = require('express');

const { body, validationResult } = require('express-validator');

const User = require('../models/User');

const generateToken = require('../utils/generateToken');

const { protect } = require('../middleware/auth');

const sendEmail = require('../utils/sendEmail');

const uploadAvatar = require('../middleware/uploadAvatar');



const router = express.Router();



// @route   POST /api/auth/register

// @desc    Register a new user (supports optional avatar image)

// @access  Public

router.post('/register',

  uploadAvatar.single('avatar'),

  [

    body('name').trim().notEmpty().withMessage('Name is required'),

    body('email').isEmail().withMessage('Please provide a valid email'),

    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

    body('phone').notEmpty().withMessage('Phone number is required'),

    body('role').isIn(['farmer', 'buyer', 'admin']).withMessage('Role must be farmer, buyer, or admin')

  ],

  async (req, res) => {

  try {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

      return res.status(400).json({ success: false, errors: errors.array() });

    }



    const { name, email, password, phone, role, address, farmSize, businessName, businessType } = req.body;



    // Normalize email (lowercase and trim) to match schema behavior

    const normalizedEmail = email.toLowerCase().trim();



    // Check if user already exists

    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {

      return res.status(400).json({

        success: false,

        message: 'User already exists with this email'

      });

    }



    // Prepare user data

    const userData = {

      name: name.trim(),

      email: normalizedEmail,

      password,

      phone: phone.trim(),

      role,

      address: address || {}

    };

    

    // Ensure address is an object with at least country default

    if (!userData.address || typeof userData.address !== 'object') {

      userData.address = {};

    }

    if (!userData.address.country) {

      userData.address.country = 'India';

    }



    // Add role-specific fields only if provided and valid

    if (role === 'farmer') {

      if (farmSize !== undefined && farmSize !== null && farmSize !== '' && !isNaN(parseFloat(farmSize))) {

        userData.farmSize = parseFloat(farmSize);

      }

    } else if (role === 'buyer') {

      if (businessName) {

        userData.businessName = businessName;

      }

      if (businessType) {

        userData.businessType = businessType;

      }

    }



    // Attach avatar URL if image was uploaded

    if (req.file) {

      userData.avatarUrl = `/uploads/avatars/${req.file.filename}`;

    }



    // Generate custom userId for farmer/buyer
    if (role === 'farmer' || role === 'buyer') {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const roleCode = role === 'farmer' ? 'FAR' : 'BUY';
      const count = await User.countDocuments({ role });
      const sequence = String(count + 1).padStart(3, '0');
      userData.userId = `${day}${month}${year}${roleCode}${sequence}`;
    }

    // Create user
    const user = await User.create(userData);


    // Generate token

    const token = generateToken(user._id);



    res.status(201).json({

      success: true,

      token,

      user: {
        id: user._id,

        name: user.name,

        email: user.email,

        role: user.role,

        isVerified: user.isVerified,

        avatarUrl: user.avatarUrl || '',
        userId: user.userId || ''
      }

    });

  } catch (error) {

    console.error('Registration error:', error);

    console.error('Error stack:', error.stack);

    

    // Handle duplicate email error

    if (error.code === 11000) {

      return res.status(400).json({

        success: false,

        message: 'User already exists with this email'

      });

    }

    

    // Handle validation errors

    if (error.name === 'ValidationError') {

      const errors = Object.values(error.errors).map(err => ({

        param: err.path,

        msg: err.message,

        field: err.path,

        message: err.message

      }));

      return res.status(400).json({

        success: false,

        message: 'Validation error',

        errors

      });

    }

    

    // Handle JWT_SECRET missing error

    if (error.message && error.message.includes('JWT_SECRET')) {

      return res.status(500).json({

        success: false,

        message: 'Server configuration error: JWT_SECRET is missing. Please check your .env file.'

      });

    }

    

    res.status(500).json({

      success: false,

      message: 'Server error',

      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',

      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })

    });

  }

});



// @route   POST /api/auth/login

// @desc    Login user

// @access  Public

router.post('/login', [

  body('email').isEmail().withMessage('Please provide a valid email'),

  body('password').notEmpty().withMessage('Password is required')

], async (req, res) => {

  try {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

      return res.status(400).json({ success: false, errors: errors.array() });

    }



    const { email, password } = req.body;



    // Normalize email (lowercase and trim) to match schema behavior

    const normalizedEmail = email.toLowerCase().trim();



    // Check if user exists and get password

    const user = await User.findOne({ email: normalizedEmail }).select('+password');



    if (!user) {

      return res.status(401).json({

        success: false,

        message: 'Invalid credentials'

      });

    }



    // Compare password

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {

      return res.status(401).json({

        success: false,

        message: 'Invalid credentials'

      });

    }



    if (!user.isActive) {

      return res.status(401).json({

        success: false,

        message: 'Account is deactivated. Please contact admin.'

      });

    }



    // Generate token

    const token = generateToken(user._id);



    res.json({

      success: true,

      token,

      user: {

        id: user._id,

        name: user.name,

        email: user.email,

        role: user.role,

        isVerified: user.isVerified,

        avatarUrl: user.avatarUrl || ''

      }

    });

  } catch (error) {

    console.error('Login error:', error);

    console.error('Error stack:', error.stack);

    

    // Handle JWT_SECRET missing error

    if (error.message && error.message.includes('JWT_SECRET')) {

      return res.status(500).json({

        success: false,

        message: 'Server configuration error: JWT_SECRET is missing. Please check your .env file.'

      });

    }

    

    res.status(500).json({

      success: false,

      message: 'Server error',

      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'

    });

  }

});



// @route   GET /api/auth/me

// @desc    Get current user

// @access  Private

router.get('/me', protect, async (req, res) => {

  try {

    const user = await User.findById(req.user.id);



    res.json({

      success: true,

      user

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



