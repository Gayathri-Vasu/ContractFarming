const mongoose = require('mongoose');
const reviewSchema = new mongoose.Schema({
  contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewerRole: { type: String, enum: ['farmer', 'buyer'], required: true },
  revieweeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  revieweeRole: { type: String, enum: ['farmer', 'buyer'], required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, minlength: 1, required: true },
  createdAt: { type: Date, default: Date.now }
});
reviewSchema.index({ contractId: 1, reviewerId: 1 }, { unique: true });
module.exports = mongoose.model('Review', reviewSchema);
