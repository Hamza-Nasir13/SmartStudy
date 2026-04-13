const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'ethereal.test@example.com',
    pass: process.env.EMAIL_PASS || 'ethereal.test.pass'
  }
});

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ email, password, name });
    await user.save();

    // Send welcome email
    try {
      await transporter.sendMail({
        from: '"AI Smart Study App" <noreply@smartstudy.app>', // sender address
        to: user.email, // list of receivers
        subject: "Welcome to AI Smart Study App 🎓", // Subject line
        text: `
Hi ${user.name},

Thank you for signing up!

We're excited to help you study smarter and save time.

Get started by uploading your first textbook and generating your study material instantly.

Best,
AI Smart Study Team
        `, // plain text body
      });
      console.log('Welcome email sent to:', user.email);
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail registration if email fails
    }

    const token = user.generateAuthToken();

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user._id, email: user.email, name: user.name, plan: user.plan },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = user.generateAuthToken();

    res.json({
      message: 'Login successful',
      user: { id: user._id, email: user.email, name: user.name, plan: user.plan },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
