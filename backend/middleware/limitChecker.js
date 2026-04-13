const User = require('../models/User');

// Constants for limits
const MAX_UPLOADS_FREE = 3;
const MAX_FLASHCARDS_FREE = 50;

// Middleware to check PDF upload limits
const checkPdfUploadLimit = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Premium users bypass all limits
    if (user.plan === 'premium') {
      return next();
    }

    // Check free tier limit
    if (user.usage.uploads_used >= MAX_UPLOADS_FREE) {
      return res.status(403).json({
        message: 'Upload limit reached. Upgrade to premium for unlimited uploads.',
        limit: MAX_UPLOADS_FREE,
        current: user.usage.uploads_used,
        upgradeRequired: true
      });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Middleware to check flashcard creation limits
const checkFlashcardLimit = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Premium users bypass all limits
    if (user.plan === 'premium') {
      return next();
    }

    // Check free tier limit
    if (user.usage.flashcards_generated >= MAX_FLASHCARDS_FREE) {
      return res.status(403).json({
        message: 'Flashcard limit reached. Upgrade to premium for unlimited flashcards.',
        limit: MAX_FLASHCARDS_FREE,
        current: user.usage.flashcards_generated,
        upgradeRequired: true
      });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if there's room for bulk flashcard creation
// Returns null if okay, or error message if limit would be exceeded
const checkBulkFlashcardLimit = async (userId, newCount) => {
  const user = await User.findById(userId);
  if (!user) return { error: 'User not found', status: 404 };

  if (user.plan === 'premium') return null;

  const remaining = MAX_FLASHCARDS_FREE - user.usage.flashcards_generated;
  if (newCount > remaining) {
    return {
      error: `You can only create ${remaining} more flashcards. Please request fewer or upgrade to premium.`,
      status: 403,
      limit: MAX_FLASHCARDS_FREE,
      current: user.usage.flashcards_generated,
      requested: newCount,
      available: remaining,
      upgradeRequired: true
    };
  }
  return null;
};

// Increment upload counter (only increments, never decrements)
const incrementUploadCounter = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    $inc: { 'usage.uploads_used': 1 }
  });
};

// Increment flashcard counter (only increments, never decrements)
const incrementFlashcardCounter = async (userId, count = 1) => {
  await User.findByIdAndUpdate(userId, {
    $inc: { 'usage.flashcards_generated': count }
  });
};

module.exports = {
  checkPdfUploadLimit,
  checkFlashcardLimit,
  checkBulkFlashcardLimit,
  incrementUploadCounter,
  incrementFlashcardCounter,
  MAX_UPLOADS_FREE,
  MAX_FLASHCARDS_FREE
};