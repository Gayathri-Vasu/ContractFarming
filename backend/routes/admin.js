const express = require('express');

const User = require('../models/User');

const Contract = require('../models/Contract');

const Crop = require('../models/Crop');

const MarketplaceProduct = require('../models/MarketplaceProduct');

const Payment = require('../models/Payment');

const Notification = require('../models/Notification');

const { protect, authorize } = require('../middleware/auth');



const router = express.Router();



// All admin routes require admin role

router.use(protect);

router.use(authorize('admin'));



// @route   GET /api/admin/dashboard

// @desc    Get admin dashboard statistics

// @access  Private (Admin only)

router.get('/dashboard', async (req, res) => {

  try {

    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });

    const totalFarmers = await User.countDocuments({ role: 'farmer' });

    const totalBuyers = await User.countDocuments({ role: 'buyer' });

    const totalAdmins = await User.countDocuments({ role: 'admin' });

    const verifiedUsers = await User.countDocuments({ isVerified: true, role: { $ne: 'admin' } });

    const pendingVerification = await User.countDocuments({ isVerified: false, role: { $ne: 'admin' } });



    // Total crops should reflect only Marketplace master crops

    const totalCrops = await MarketplaceProduct.countDocuments();

    // Keep additional fields for UI; map marketplace 'isActive' to available for basic display

    const availableCrops = await MarketplaceProduct.countDocuments({ isActive: true });

    const contractedCrops = 0;



    const totalContracts = await Contract.countDocuments();

    const activeContracts = await Contract.countDocuments({ 

      status: { $in: ['active', 'accepted', 'Active', 'Accepted'] }

    });

    const completedContracts = await Contract.countDocuments({ status: 'completed' });

    const pendingContracts = await Contract.countDocuments({ status: 'pending' });



    const totalPayments = await Payment.countDocuments();

    const completedPayments = await Payment.countDocuments({ status: 'completed' });

    const totalRevenue = await Payment.aggregate([

      { $match: { status: 'completed' } },

      { $group: { _id: null, total: { $sum: '$amount' } } }

    ]);



    const disputedContracts = await Contract.countDocuments({ status: 'disputed' });



    res.json({

      success: true,

      data: {

        users: {

          total: totalUsers,

          farmers: totalFarmers,

          buyers: totalBuyers,

          admins: totalAdmins,

          verified: verifiedUsers,

          pendingVerification

        },

        crops: {

          total: totalCrops,

          available: availableCrops,

          contracted: contractedCrops

        },

        contracts: {

          total: totalContracts,

          active: activeContracts,

          completed: completedContracts,

          pending: pendingContracts,

          disputed: disputedContracts

        },

        payments: {

          total: totalPayments,

          completed: completedPayments,

          totalRevenue: totalRevenue[0]?.total || 0

        }

      }

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: 'Server error',

      error: error.message

    });

  }

});



// @route   GET /api/admin/users

// @desc    Get all users

// @access  Private (Admin only)

router.get('/users', async (req, res) => {

  try {

    const { role, isVerified, page = 1, limit = 10 } = req.query;

    const query = {};



    if (role) query.role = role;

    if (isVerified !== undefined) query.isVerified = isVerified === 'true';



    const users = await User.find(query)

      .select('-password')

      .sort({ createdAt: -1 })

      .limit(limit * 1)

      .skip((page - 1) * limit);



    const total = await User.countDocuments(query);



    res.json({

      success: true,

      count: users.length,

      total,

      page: parseInt(page),

      pages: Math.ceil(total / limit),

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



// @route   PUT /api/admin/users/:id/verify

// @desc    Verify a user

// @access  Private (Admin only)

router.put('/users/:id/verify', async (req, res) => {

  try {

    const user = await User.findById(req.params.id);



    if (!user) {

      return res.status(404).json({

        success: false,

        message: 'User not found'

      });

    }



    user.isVerified = true;

    await user.save();



    // Create notification

    await Notification.create({

      user: user._id,

      type: 'system',

      title: 'Account Verified',

      message: 'Your account has been verified by admin'

    });



    res.json({

      success: true,

      message: 'User verified successfully',

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



// @route   PUT /api/admin/users/:id/deactivate

// @desc    Deactivate a user

// @access  Private (Admin only)

router.put('/users/:id/deactivate', async (req, res) => {

  try {

    const user = await User.findById(req.params.id);



    if (!user) {

      return res.status(404).json({

        success: false,

        message: 'User not found'

      });

    }



    user.isActive = false;

    await user.save();



    res.json({

      success: true,

      message: 'User deactivated successfully'

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: 'Server error',

      error: error.message

    });

  }

});



// @route   GET /api/admin/contracts

// @desc    Get all contracts

// @access  Private (Admin only)

router.get('/contracts', async (req, res) => {

  try {

    const { status, page = 1, limit = 10 } = req.query;

    const query = {};



    if (status) query.status = status;



    const contracts = await Contract.find(query)

      .populate('crop', 'name')

      .populate('farmer', 'name email userId phone address farmSize rating')

      .populate('buyer', 'name email userId phone businessName businessType address')

      .sort({ createdAt: -1 })

      .limit(limit * 1)

      .skip((page - 1) * limit);



    const total = await Contract.countDocuments(query);



    res.json({

      success: true,

      count: contracts.length,

      total,

      page: parseInt(page),

      pages: Math.ceil(total / limit),

      data: contracts

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: 'Server error',

      error: error.message

    });

  }

});



// @route   GET /api/admin/farmers

// @desc    Get all farmers with detailed stats

// @access  Private (Admin only)

router.get('/farmers', async (req, res) => {

  try {

    const { page = 1, limit = 10 } = req.query;

    

    const farmers = await User.find({ role: 'farmer' })

      .select('name email role userId phone address isVerified createdAt')

      .sort({ createdAt: -1 })

      .limit(limit * 1)

      .skip((page - 1) * limit);



    // Get detailed stats for each farmer

    const farmersWithStats = await Promise.all(

      farmers.map(async (farmer) => {

        const cropsCount = await Crop.countDocuments({ farmer: farmer._id });

        const contractsCount = await Contract.countDocuments({ farmer: farmer._id });

        const activeContracts = await Contract.countDocuments({ 

          farmer: farmer._id, 

          status: 'active' 

        });

        const completedContracts = await Contract.countDocuments({ 

          farmer: farmer._id, 

          status: 'completed' 

        });

        

        // Calculate total earnings

        const payments = await Payment.aggregate([

          { $match: { farmer: farmer._id, status: 'completed' } },

          { $group: { _id: null, total: { $sum: '$amount' } } }

        ]);

        const totalEarnings = payments[0]?.total || 0;



        return {

          ...farmer.toObject(),

          stats: {

            cropsCount,

            contractsCount,

            activeContracts,

            completedContracts,

            totalEarnings

          }

        };

      })

    );



    const total = await User.countDocuments({ role: 'farmer' });



    res.json({

      success: true,

      count: farmersWithStats.length,

      total,

      page: parseInt(page),

      pages: Math.ceil(total / limit),

      data: farmersWithStats

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: 'Server error',

      error: error.message

    });

  }

});



// @route   GET /api/admin/buyers

// @desc    Get all buyers with detailed stats

// @access  Private (Admin only)

router.get('/buyers', async (req, res) => {

  try {

    const { page = 1, limit = 10 } = req.query;

    

    const buyers = await User.find({ role: 'buyer' })

      .select('name email role userId phone businessName businessType address isVerified createdAt')

      .sort({ createdAt: -1 })

      .limit(limit * 1)

      .skip((page - 1) * limit);



    // Get detailed stats for each buyer

    const buyersWithStats = await Promise.all(

      buyers.map(async (buyer) => {

        const contractsCount = await Contract.countDocuments({ buyer: buyer._id });

        const activeContracts = await Contract.countDocuments({ 

          buyer: buyer._id, 

          status: 'active' 

        });

        const completedContracts = await Contract.countDocuments({ 

          buyer: buyer._id, 

          status: 'completed' 

        });

        

        // Calculate total spending

        const payments = await Payment.aggregate([

          { $match: { buyer: buyer._id, status: 'completed' } },

          { $group: { _id: null, total: { $sum: '$amount' } } }

        ]);

        const totalSpending = payments[0]?.total || 0;



        return {

          ...buyer.toObject(),

          stats: {

            contractsCount,

            activeContracts,

            completedContracts,

            totalSpending

          }

        };

      })

    );



    const total = await User.countDocuments({ role: 'buyer' });



    res.json({

      success: true,

      count: buyersWithStats.length,

      total,

      page: parseInt(page),

      pages: Math.ceil(total / limit),

      data: buyersWithStats

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: 'Server error',

      error: error.message

    });

  }

});



// @route   GET /api/admin/payments

// @desc    Get all payments/transactions

// @access  Private (Admin only)

router.get('/payments', async (req, res) => {

  try {

    const { status, paymentType, page = 1, limit = 20 } = req.query;

    const query = {};



    if (status) query.status = status;

    if (paymentType) query.paymentType = paymentType;



    const payments = await Payment.find(query)

      .populate({
        path: 'contract',
        select: 'contractId cropName crop totalAmount quantity unit deliveryDate',
        populate: { path: 'crop', select: 'name' }
      })

      .populate('farmer', 'name email phone')

      .populate('buyer', 'name email businessName')

      .sort({ createdAt: -1 })

      .limit(limit * 1)

      .skip((page - 1) * limit);



    const total = await Payment.countDocuments(query);



    res.json({

      success: true,

      count: payments.length,

      total,

      page: parseInt(page),

      pages: Math.ceil(total / limit),

      data: payments

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: 'Server error',

      error: error.message

    });

  }

});



// @route   GET /api/admin/crops

// @desc    Get all crops

// @access  Private (Admin only)

router.get('/crops', async (req, res) => {

  try {

    const { status, category, page = 1, limit = 20 } = req.query;

    const query = {};



    if (status) query.status = status;

    if (category) query.category = category;



    const crops = await Crop.find(query)

      .populate('farmer', 'name email phone address')

      .populate('contractId', 'buyer totalAmount status')

      .sort({ createdAt: -1 })

      .limit(limit * 1)

      .skip((page - 1) * limit);



    const total = await Crop.countDocuments(query);



    res.json({

      success: true,

      count: crops.length,

      total,

      page: parseInt(page),

      pages: Math.ceil(total / limit),

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



// @route   GET /api/admin/analytics

// @desc    Get platform analytics

// @access  Private (Admin only)

router.get('/analytics', async (req, res) => {

  try {

    // Revenue analytics

    const revenueByMonth = await Payment.aggregate([

      { $match: { status: 'completed' } },

      {

        $group: {

          _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } },

          total: { $sum: '$amount' },

          count: { $sum: 1 }

        }

      },

      { $sort: { _id: 1 } }

    ]);



    // Contracts by status

    const contractsByStatus = await Contract.aggregate([

      {

        $group: {

          _id: '$status',

          count: { $sum: 1 },

          totalAmount: { $sum: '$totalAmount' }

        }

      }

    ]);



    // Top farmers by earnings

    const topFarmers = await Payment.aggregate([

      { $match: { status: 'completed' } },

      {

        $group: {

          _id: '$farmer',

          totalEarnings: { $sum: '$amount' },

          paymentCount: { $sum: 1 }

        }

      },

      { $sort: { totalEarnings: -1 } },

      { $limit: 10 },

      {

        $lookup: {

          from: 'users',

          localField: '_id',

          foreignField: '_id',

          as: 'farmer'

        }

      },

      { $unwind: '$farmer' },

      {

        $project: {

          farmerName: '$farmer.name',

          farmerEmail: '$farmer.email',

          totalEarnings: 1,

          paymentCount: 1

        }

      }

    ]);



    // Top buyers by spending

    const topBuyers = await Payment.aggregate([

      { $match: { status: 'completed' } },

      {

        $group: {

          _id: '$buyer',

          totalSpending: { $sum: '$amount' },

          paymentCount: { $sum: 1 }

        }

      },

      { $sort: { totalSpending: -1 } },

      { $limit: 10 },

      {

        $lookup: {

          from: 'users',

          localField: '_id',

          foreignField: '_id',

          as: 'buyer'

        }

      },

      { $unwind: '$buyer' },

      {

        $project: {

          buyerName: '$buyer.name',

          buyerEmail: '$buyer.email',

          businessName: '$buyer.businessName',

          totalSpending: 1,

          paymentCount: 1

        }

      }

    ]);



    // Crops by category

    const cropsByCategory = await Crop.aggregate([

      {

        $group: {

          _id: '$category',

          count: { $sum: 1 },

          totalQuantity: { $sum: '$quantity' }

        }

      }

    ]);



    res.json({

      success: true,

      data: {

        revenueByMonth,

        contractsByStatus,

        topFarmers,

        topBuyers,

        cropsByCategory

      }

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: 'Server error',

      error: error.message

    });

  }

});



// @route   PUT /api/admin/contracts/:id/resolve-dispute

// @desc    Resolve a contract dispute

// @access  Private (Admin only)

router.put('/contracts/:id/resolve-dispute', async (req, res) => {

  try {

    const { resolution } = req.body;



    if (!resolution) {

      return res.status(400).json({

        success: false,

        message: 'Resolution text is required'

      });

    }



    const contract = await Contract.findById(req.params.id);



    if (!contract) {

      return res.status(404).json({

        success: false,

        message: 'Contract not found'

      });

    }



    if (contract.status !== 'disputed') {

      return res.status(400).json({

        success: false,

        message: 'Contract is not in disputed status'

      });

    }



    contract.dispute.resolution = resolution;

    contract.dispute.resolvedAt = new Date();

    contract.status = 'completed';

    await contract.save();



    // Create notifications

    await Notification.create({

      user: contract.farmer,

      type: 'system',

      title: 'Dispute Resolved',

      message: `Your contract dispute has been resolved: ${resolution}`,

      relatedId: contract._id,

      relatedModel: 'Contract'

    });



    await Notification.create({

      user: contract.buyer,

      type: 'system',

      title: 'Dispute Resolved',

      message: `Your contract dispute has been resolved: ${resolution}`,

      relatedId: contract._id,

      relatedModel: 'Contract'

    });



    res.json({

      success: true,

      message: 'Dispute resolved successfully',

      data: contract

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















