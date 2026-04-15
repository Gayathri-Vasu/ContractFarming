const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const Crop = require('../models/Crop');
const Contract = require('../models/Contract');
const User = require('../models/User');

const router = express.Router();

const generateContractId = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CF-${y}${m}${d}-${rand}`;
};

router.post('/accept/:id', protect, authorize('buyer'), async (req, res) => {
  try {
    const cropId = req.params.id;
    const crop = await Crop.findById(cropId).populate('farmer');
    if (!crop) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (crop.status !== 'available') {
      return res.status(400).json({ success: false, message: 'Product is not available' });
    }

    const buyer = await User.findById(req.user.id);
    if (!buyer || buyer.role !== 'buyer') {
      return res.status(403).json({ success: false, message: 'Only buyers can accept products' });
    }

    const quantity = Number(crop.quantity) || 0;
    const pricePerUnit = Number(crop.expectedPrice) || 0;
    const totalAmount = quantity * pricePerUnit;

    const contractPayload = {
      contractId: generateContractId(),
      createdBy: 'buyer',
      crop: crop._id,
      cropName: crop.name,
      cropGrade: 'A',
      farmer: crop.farmer._id,
      buyer: buyer._id,
      quantity,
      unit: crop.unit || 'kg',
      pricePerUnit,
      totalAmount,
      deliveryDate: crop.harvestDate,
      deliveryAddress: crop.location?.fullAddress,
      status: 'pending',
      advancePayment: { amount: 0 },
      finalPayment: { amount: totalAmount }
    };

    const contract = await Contract.create(contractPayload);

    crop.status = 'contracted';
    crop.contractId = contract._id;
    await crop.save();

    return res.status(201).json({
      success: true,
      message: 'Product accepted and contract created',
      data: contract
    });
  } catch (error) {
    console.error('Error accepting product and creating contract:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
