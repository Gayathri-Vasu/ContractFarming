const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const uploadAvatar = require('../middleware/uploadAvatar');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email role userId phone address avatarUrl isVerified createdAt updatedAt');
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/users/emails
// @desc    Get list of user emails (development only)
// @access  Public (dev-only)
router.get('/emails', async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).json({
        success: false,
        message: 'Not found'
      });
    }

    const users = await User.find({}, { email: 1, _id: 0 }).sort({ email: 1 }).limit(500);
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const allowedFields = ['name', 'phone', 'address', 'farmSize', 'cropsGrown', 
                          'businessName', 'businessType', 'licenseNumber'];
    const updateData = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/users/avatar
// @desc    Upload or update avatar image
// @access  Private
router.post('/avatar', protect, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No avatar image uploaded',
      });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatarUrl },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Avatar updated successfully',
      avatarUrl,
      user,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading avatar',
      error: error.message,
    });
  }
});

// @route   POST /api/users/upload-documents
// @desc    Upload verification documents
// @access  Private
router.post('/upload-documents', protect, [
  body('documentType').notEmpty().withMessage('Document type is required'),
  body('documentUrl').notEmpty().withMessage('Document URL is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { documentType, documentUrl } = req.body;

    const user = await User.findById(req.user.id);
    user.verificationDocuments.push({
      documentType,
      documentUrl,
      uploadedAt: new Date()
    });
    await user.save();

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: user.verificationDocuments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (public info only)
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -verificationDocuments');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Dev helper: list user emails for login suggestions (public, non-sensitive)
router.get('/emails', async (req, res) => {
  try {
    const users = await User.find({}, 'email').sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;





