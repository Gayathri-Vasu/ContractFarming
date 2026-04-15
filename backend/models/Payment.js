const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  contract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract',
    required: true
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  payerRole: {
    type: String,
    enum: ['farmer', 'buyer'],
    required: true
  },
  receiverRole: {
    type: String,
    enum: ['farmer', 'buyer'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentType: {
    type: String,
    enum: ['advance', 'final', 'full'],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'stripe', 'bank_transfer', 'upi', 'gpay', 'card', 'cash'],
    default: 'razorpay'
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  receipt: {
    url: String,
    generatedAt: Date
  },
  paidAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for payment tracking
paymentSchema.index({ contract: 1, status: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ payerRole: 1, buyer: 1, farmer: 1, createdAt: -1 });

paymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);

