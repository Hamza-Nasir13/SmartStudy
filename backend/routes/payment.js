const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to protect routes
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Get subscription plans
router.get('/plans', (req, res) => {
  const plans = [
    {
      id: 'free',
      name: 'Free Plan',
      price: 0,
      billing: 'lifetime',
      features: {
        maxUploads: 3,
        maxFlashcards: 50,
      }
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: 400,
      billing: 'annually',
      features: {
        maxUploads: -1, // Unlimited
        maxFlashcards: -1, // Unlimited
      }
    },
    {
      id: 'premium-monthly',
      name: 'Premium Plan (Monthly)',
      price: 600,
      billing: 'monthly',
      features: {
        maxUploads: -1, // Unlimited
        maxFlashcards: -1, // Unlimited
      }
    }
  ];

  res.json({ plans });
});

// Manual payment processing - for MVP, we simulate payment confirmation
// In a real app, this would integrate with payment gateway webhooks
router.post('/confirm', authenticate, async (req, res) => {
  try {
    const { planId, paymentProof } = req.body;

    // Validate plan
    if (!planId || (planId !== 'premium' && planId !== 'premium-monthly')) {
      return res.status(400).json({ message: 'Invalid plan selected for upgrade' });
    }

    // For MVP: We'll simulate payment confirmation
    // In production, you would verify payment proof with payment processor
    // and only then upgrade the user

    // Update user's plan
    const user = await User.findByIdAndUpdate(
      req.userId,
      { plan: 'premium' }, // Both plan types map to 'premium' in DB
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: `Payment confirmed! You have been upgraded to Premium plan.`,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        plan: user.plan
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;