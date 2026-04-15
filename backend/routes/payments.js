const express = require('express');
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Contract = require('../models/Contract');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const Razorpay = require('razorpay');

const router = express.Router();

// Initialize Razorpay (use test keys for development)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret'
});

// @route   POST /api/payments/create-order
// @desc    Create Razorpay order
// @access  Private
router.post('/create-order', protect, [
  body('contractId').notEmpty().withMessage('Contract ID is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('paymentType').isIn(['advance', 'final', 'full']).withMessage('Invalid payment type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { contractId, amount, paymentType } = req.body;

    // Verify contract
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'buyer' || contract.buyer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the buyer can make payments'
      });
    }

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `contract_${contractId}_${Date.now()}`,
      notes: {
        contractId: contractId.toString(),
        paymentType,
        buyerId: req.user.id.toString()
      }
    };

    const order = await razorpay.orders.create(options);

    // Create payment record
    const payment = await Payment.create({
      contract: contractId,
      farmer: contract.farmer,
      buyer: req.user.id,
      payerRole: 'buyer',
      receiverRole: 'farmer',
      amount,
      paymentType,
      razorpayOrderId: order.id,
      status: 'pending'
    });

    res.json({
      success: true,
      order,
      paymentId: payment._id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/payments/verify
// @desc    Verify Razorpay payment
// @access  Private
router.post('/verify', protect, [
  body('paymentId').notEmpty().withMessage('Payment ID is required'),
  body('razorpayOrderId').notEmpty().withMessage('Order ID is required'),
  body('razorpayPaymentId').notEmpty().withMessage('Razorpay Payment ID is required'),
  body('razorpaySignature').notEmpty().withMessage('Signature is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // Verify payment signature
    const crypto = require('crypto');
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret';
    if (!keySecret) {
      return res.status(500).json({ success: false, message: 'Payment configuration error: missing key secret' });
    }
    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(razorpayOrderId + '|' + razorpayPaymentId);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Update payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.transactionId = razorpayPaymentId;
    payment.status = 'completed';
    payment.paidAt = new Date();
    await payment.save();

    // Update contract payment status
    const contract = await Contract.findById(payment.contract);
    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contract not found for payment' });
    }
    if (payment.paymentType === 'advance') {
      contract.advancePayment.paid = true;
      contract.advancePayment.paidAt = new Date();
    } else if (payment.paymentType === 'final') {
      contract.finalPayment.paid = true;
      contract.finalPayment.paidAt = new Date();
    }

    if (contract.advancePayment.paid && contract.finalPayment.paid) {
      contract.status = 'active';
    }
    await contract.save();

    // Create notification for farmer
    try {
      await Notification.create({
        user: contract.farmer,
        type: 'payment_received',
        title: 'Payment Received',
        message: `Payment of ₹${payment.amount} has been received for contract`,
        relatedId: payment._id,
        relatedModel: 'Payment'
      });
    } catch (e) {
      // Do not fail verification if notification cannot be created
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment
    });
  } catch (error) {
    const msg = error?.message || 'Server error';
    res.status(500).json({ success: false, message: msg });
  }
});

// @route   POST /api/payments/simulate
// @desc    Simulate a payment without real gateway
// @access  Private
router.post('/simulate', protect, [
  body('contractId').notEmpty().withMessage('Contract ID is required'),
  body('paymentMethod').isIn(['upi', 'gpay', 'card']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { contractId, paymentMethod } = req.body;
    const contract = await Contract.findById(contractId).populate('farmer buyer');
    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contract not found' });
    }
    // Prevent duplicate full payment
    if ((contract.paymentStatus || '').toLowerCase() === 'paid' || (contract.status || '').toLowerCase() === 'paid') {
      return res.status(409).json({ success: false, message: 'Contract already paid' });
    }
    const payerRoleExpected = 'buyer';
    if (req.user.role !== payerRoleExpected) {
      return res.status(403).json({ success: false, message: 'Only the buyer can pay for this contract' });
    }
    const payerId = req.user.id;
    const buyerId = String(contract.buyer?._id || contract.buyer);
    const farmerId = String(contract.farmer?._id || contract.farmer);
    const isPayerInContract = (req.user.role === 'buyer' && buyerId === payerId) || (req.user.role === 'farmer' && farmerId === payerId);
    if (!isPayerInContract) {
      return res.status(403).json({ success: false, message: 'You are not part of this contract' });
    }
    // Generate unique transaction id
    const txn = `TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    // Double-check uniqueness
    const existsTxn = await Payment.findOne({ transactionId: txn }).lean();
    if (existsTxn) {
      return res.status(500).json({ success: false, message: 'Transaction collision, please retry' });
    }
    // Determine remaining final payment amount
    const advAmt = Number(contract.advancePayment?.amount || 0);
    const totalAmt = Number(contract.totalAmount) || 0;
    const remainingFinal = Math.max(totalAmt - advAmt, 0);
    // Create payment record (simulate paying the remaining final amount)
    const amount = remainingFinal;
    const payment = await Payment.create({
      contract: contract._id,
      farmer: farmerId,
      buyer: buyerId,
      payerRole: req.user.role,
      receiverRole: req.user.role === 'buyer' ? 'farmer' : 'buyer',
      amount,
      paymentType: 'full',
      paymentMethod,
      transactionId: txn,
      status: 'completed',
      paidAt: new Date()
    });
    // Update contract snapshot
    contract.paymentStatus = 'Paid';
    contract.status = 'paid';
    // Mark final payment as paid and ensure amount is set
    contract.finalPayment = {
      amount: remainingFinal,
      paid: true,
      paidAt: new Date()
    };
    // Mirror into embedded payments for legacy views
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    contract.payments.push({
      payerId: payerId,
      payerName: req.user.name || (req.user.email || 'User'),
      receiverId: req.user.role === 'buyer' ? farmerId : buyerId,
      receiverName: req.user.role === 'buyer' ? (contract.farmer?.name || 'Farmer') : (contract.buyer?.name || 'Buyer'),
      amount,
      date: now,
      time: timeString,
      paymentMethod: paymentMethod.toUpperCase()
    });
    await contract.save();
    // Notify receiver
    await Notification.create({
      user: req.user.role === 'buyer' ? farmerId : buyerId,
      type: 'payment_received',
      title: 'Payment Received',
      message: `Payment of ₹${amount} has been received for contract ${contract.contractId}`,
      relatedId: payment._id,
      relatedModel: 'Payment'
    });
    return res.json({ success: true, message: 'Payment simulated successfully', data: { transactionId: txn, paidAt: payment.paidAt, amount, contractId: String(contract._id) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/payments
// @desc    Get all payments (filtered by user role)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'farmer') {
      query.farmer = req.user.id;
      // Farmer should see payments received (where receiverRole is 'farmer')
      query.receiverRole = 'farmer';
    } else if (req.user.role === 'buyer') {
      query.buyer = req.user.id;
      query.payerRole = 'buyer';
    }

    const { status, contractId } = req.query;
    if (status) query.status = status;
    if (contractId) query.contract = contractId;

    const payments = await Payment.find(query)
      .populate('contract', 'contractId crop deliveryDate status')
      .populate('farmer', 'name email')
      .populate('buyer', 'name email businessName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: payments.length,
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

// @route   GET /api/payments/:id
// @desc    Get single payment by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('contract')
      .populate('farmer', 'name email phone')
      .populate('buyer', 'name email businessName');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' &&
        payment.farmer._id.toString() !== req.user.id &&
        payment.buyer._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this payment'
      });
    }

    res.json({
      success: true,
      data: payment
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







