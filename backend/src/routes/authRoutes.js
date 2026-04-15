const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, ROLES } = require('../models/User');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-me';
const JWT_EXPIRES_IN = '7d';

// Helper to create JWT
const createToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      phone,
      location,
      farmSize,
      mainCrops,
      companyName,
      preferredCommodities,
    } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
      return res
        .status(400)
        .json({ message: 'Please fill in all required fields.' });
    }

    if (!ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid user type selected.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res
        .status(409)
        .json({ message: 'An account with this email already exists.' });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 6 characters long.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      phone,
      location,
      farmSize,
      mainCrops,
      companyName,
      preferredCommodities,
    });

    const token = createToken(user);

    res.status(201).json({
      message: `Successfully registered as a ${role}.`,
      role,
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Please provide both email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = createToken(user);

    res.json({
      message: `Welcome back, ${user.firstName}!`,
      role: user.role,
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

module.exports = router;

