const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const Contract = require('../models/Contract');
const Review = require('../models/Review');
const User = require('../models/User');

const router = express.Router();
const mongoose = require('mongoose');

router.post(
  '/',
  protect,
  [
    body('contractId').notEmpty().withMessage('Contract ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('comment').isLength({ min: 1 }).withMessage('Comment must be at least 1 character')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
      const { contractId, rating, comment } = req.body;
      if (!mongoose.isValidObjectId(contractId)) {
        return res.status(400).json({ success: false, message: 'Invalid contractId' });
      }
      const commentText = String(comment || '').trim();
      if (commentText.length < 1) {
        return res.status(400).json({ success: false, message: 'Comment cannot be empty' });
      }
      const contract = await Contract.findById(contractId).populate('buyer').populate('farmer');
      if (!contract) {
        return res.status(404).json({ success: false, message: 'Contract not found' });
      }
      const isFarmer = String(contract.farmer?._id || contract.farmer) === String(req.user.id);
      const isBuyer = String(contract.buyer?._id || contract.buyer) === String(req.user.id);
      if (!isFarmer && !isBuyer) {
        return res.status(403).json({ success: false, message: 'Only participants can review' });
      }
      const reviewerRole = isFarmer ? 'farmer' : 'buyer';
      const revieweeRole = isFarmer ? 'buyer' : 'farmer';
      const revieweeId = isFarmer ? (contract.buyer?._id || contract.buyer) : (contract.farmer?._id || contract.farmer);
      if (String(revieweeId) === String(req.user.id)) {
        return res.status(400).json({ success: false, message: 'Cannot review self' });
      }
      const paidStatus = (contract.paymentStatus || contract.status || '').toString().toLowerCase();
      let isPaid = paidStatus.includes('paid') || paidStatus.includes('completed');
      if (!isPaid) {
        const totalPaid = Array.isArray(contract.payments)
          ? contract.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
          : 0;
        const totalAmount = Number(
          contract.totalAmount ||
            (Number(contract.quantity || 0) * Number(contract.pricePerUnit || 0))
        );
        isPaid = totalAmount > 0 && totalPaid >= totalAmount;
      }
      if (!isPaid) {
        return res.status(400).json({ success: false, message: 'Reviews allowed only after payment completion' });
      }
      const exists = await Review.findOne({ contractId, reviewerId: req.user.id });
      if (exists) {
        return res.status(400).json({ success: false, message: 'Review already submitted for this contract' });
      }
      const review = await Review.create({
        contractId,
        reviewerId: req.user.id,
        reviewerRole,
        revieweeId,
        revieweeRole,
        rating: Number(rating),
        comment: commentText
      });
      const reviewee = await User.findById(revieweeId);
      if (!reviewee) {
        return res.status(404).json({ success: false, message: 'Reviewee user not found' });
      }
      const prevAvg = Number(reviewee.rating?.average || 0);
      const prevCount = Number(reviewee.rating?.count || 0);
      const nextCount = prevCount + 1;
      const nextAvg = Math.round(((prevAvg * prevCount + Number(rating)) / nextCount) * 100) / 100;
      reviewee.rating = { average: nextAvg, count: nextCount };
      await reviewee.save();
      return res.status(201).json({ success: true, data: review });
    } catch (error) {
      if (error && error.code === 11000) {
        return res.status(409).json({ success: false, message: 'Review already submitted' });
      }
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

router.get('/user/:id', protect, async (req, res) => {
  try {
    const id = req.params.id;
    const reviews = await Review.find({ revieweeId: id })
      .sort({ createdAt: -1 })
      .populate('reviewerId', 'name role');
    return res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
      if (error && error.code === 11000) {
        return res.status(409).json({ success: false, message: 'Review already submitted' });
      }
      return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/contract/:id', protect, async (req, res) => {
  try {
    const id = req.params.id;
    const mine = await Review.findOne({ contractId: id, reviewerId: req.user.id });
    return res.json({ success: true, data: { reviewed: !!mine } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.get('/my', protect, async (req, res) => {
  try {
    const myReviews = await Review.find({ reviewerId: req.user.id }).select('contractId').lean();
    const contractIds = myReviews.map((r) => String(r.contractId));
    return res.json({ success: true, data: contractIds });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
