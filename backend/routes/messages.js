const express = require('express');
const Contract = require('../models/Contract');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// @route   GET /api/messages/unread/:contractId
// @desc    Get unread message count for current user for a contract
// @access  Private
router.get('/unread/:contractId', async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.contractId).select('messages buyer farmer');
    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contract not found' });
    }
    // Authorization check
    const isParty = [String(contract.buyer), String(contract.farmer)].includes(String(req.user.id));
    if (!isParty) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const count = (contract.messages || []).filter(
      (m) => String(m.receiverId || '') === String(req.user.id) && !m.isRead
    ).length;
    return res.json({ success: true, unreadCount: count });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/messages/mark-read/:contractId
// @desc    Mark all unread messages for current user as read for a contract
// @access  Private
router.put('/mark-read/:contractId', async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.contractId).select('messages buyer farmer');
    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contract not found' });
    }
    const isParty = [String(contract.buyer), String(contract.farmer)].includes(String(req.user.id));
    if (!isParty) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    let updated = 0;
    (contract.messages || []).forEach((m) => {
      if (String(m.receiverId || '') === String(req.user.id) && !m.isRead) {
        m.isRead = true;
        updated += 1;
      }
    });
    await contract.save();
    return res.json({ success: true, marked: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
