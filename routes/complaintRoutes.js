const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Complaint = require('../models/Complaint');
const upload = require('../config/multer');

// Middleware to verify JWT
const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};

// ===================== SUBMIT COMPLAINT =====================
router.post('/submit', protect, upload.array('attachments', 5), async (req, res) => {
  try {
    const { title, description, category, priority, location } = req.body;

    const attachments = req.files?.map(file => ({
      filename: file.originalname,
      path: file.path,
      mimetype: file.mimetype
    })) || [];

    const complaint = await Complaint.create({
      title,
      description,
      category,
      priority,
      location,
      attachments,
      submittedBy: req.user.id,
      statusHistory: [{ status: 'Pending', updatedBy: req.user.id, remarks: 'Complaint submitted' }]
    });

    res.status(201).json({ message: 'Complaint submitted successfully', complaint });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===================== GET MY COMPLAINTS (Resident) =====================
router.get('/my', protect, async (req, res) => {
  try {
    const complaints = await Complaint.find({ submittedBy: req.user.id }).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===================== TRACK COMPLAINT BY ID =====================
router.get('/track/:complaintId', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ complaintId: req.params.complaintId })
      .populate('submittedBy', 'name email')
      .populate('assignedTo', 'name department');

    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===================== GET ALL COMPLAINTS (Admin) =====================
router.get('/all', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    const { status, category, priority } = req.query;
    const filter = {};
    if (status)   filter.status   = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const complaints = await Complaint.find(filter)
      .populate('submittedBy', 'name email phone')
      .populate('assignedTo', 'name department')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===================== UPDATE COMPLAINT STATUS (Admin) =====================
router.put('/update/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    const { status, adminRemarks, assignedTo } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.status       = status       || complaint.status;
    complaint.adminRemarks = adminRemarks || complaint.adminRemarks;
    if (assignedTo) complaint.assignedTo  = assignedTo;
    if (status === 'Resolved') complaint.resolvedAt = new Date();

    complaint.statusHistory.push({
      status: status || complaint.status,
      updatedBy: req.user.id,
      remarks: adminRemarks || ''
    });

    await complaint.save();
    res.json({ message: 'Complaint updated successfully', complaint });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===================== GET DASHBOARD STATS (Admin) =====================
router.get('/stats', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    const total      = await Complaint.countDocuments();
    const pending    = await Complaint.countDocuments({ status: 'Pending' });
    const inProgress = await Complaint.countDocuments({ status: 'In Progress' });
    const resolved   = await Complaint.countDocuments({ status: 'Resolved' });
    const rejected   = await Complaint.countDocuments({ status: 'Rejected' });

    res.json({ total, pending, inProgress, resolved, rejected });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;