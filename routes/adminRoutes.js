const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Complaint = require('../models/Complaint');

// Middleware
const protectAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not authorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Admin access only' });
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalid' });
  }
};

// ===================== GET ALL RESIDENTS =====================
router.get('/residents', protectAdmin, async (req, res) => {
  try {
    const residents = await User.find({ role: 'resident' }).select('-password');
    res.json(residents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===================== GET ALL ADMINS =====================
router.get('/admins', protectAdmin, async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===================== GET COMPLAINT DETAILS =====================
router.get('/complaint/:id', protectAdmin, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('submittedBy', 'name email phone address')
      .populate('assignedTo', 'name department')
      .populate('statusHistory.updatedBy', 'name');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===================== ASSIGN COMPLAINT TO ADMIN =====================
router.put('/assign/:id', protectAdmin, async (req, res) => {
  try {
    const { adminId } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { assignedTo: adminId, status: 'In Progress' },
      { new: true }
    );
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json({ message: 'Complaint assigned successfully', complaint });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===================== DELETE COMPLAINT =====================
router.delete('/complaint/:id', protectAdmin, async (req, res) => {
  try {
    await Complaint.findByIdAndDelete(req.params.id);
    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;