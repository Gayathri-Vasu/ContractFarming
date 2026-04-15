const mongoose = require('mongoose');
const hub = require('../utils/notifyHub');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['contract_offer', 'contract_accepted', 'contract_signed', 'contract_request', 'payment_received', 'payment_due', 'contract_expiring', 'dispute_raised', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel'
  },
  relatedModel: {
    type: String,
    enum: ['Contract', 'Payment', 'Crop', null]
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  requestStatus: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient notification queries
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

// Broadcast via SSE after save
notificationSchema.post('save', function (doc) {
  try {
    const payload = {
      id: String(doc._id),
      type: doc.type,
      title: doc.title,
      message: doc.message,
      relatedId: doc.relatedId ? String(doc.relatedId) : null,
      relatedModel: doc.relatedModel || null,
      isRead: !!doc.isRead,
      createdAt: doc.createdAt
    };
    hub.publish(doc.user, payload);
  } catch {}
});

module.exports = mongoose.model('Notification', notificationSchema);

