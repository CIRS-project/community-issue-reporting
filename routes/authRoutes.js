const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT Token — now includes department for admins
const generateToken = (id, role, department = null) => {
  return jwt.sign({ id, role, department }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ===================== RESIDENT REGISTER =====================
router.post('/resident/register', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, phone, address, role: 'resident' });
    res.status(201).json({
      message: 'Registration successful',
      token: generateToken(user._id, user.role),
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===================== RESIDENT LOGIN =====================
router.post('/resident/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, role: 'resident' });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      message: 'Login successful',
      token: generateToken(user._id, user.role),
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===================== ADMIN REGISTER =====================
router.post('/admin/register', async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email already registered' });

    const admin = await User.create({ name, email, password, department, role: 'admin' });
    res.status(201).json({
      message: 'Admin registered successfully',
      token: generateToken(admin._id, admin.role, admin.department),
      user: { id: admin._id, name: admin.name, email: admin.email, role: admin.role, department: admin.department }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===================== ADMIN LOGIN =====================
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findOne({ email, role: 'admin' });

    if (!admin || !(await admin.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      message: 'Login successful',
      token: generateToken(admin._id, admin.role, admin.department),
      user: { id: admin._id, name: admin.name, email: admin.email, role: admin.role, department: admin.department }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;