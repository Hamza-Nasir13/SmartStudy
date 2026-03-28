const express = require('express');
const router = express.Router();
const Flashcard = require('../models/Flashcard');
const Textbook = require('../models/Textbook');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

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

// Generate flashcards from textbook text
function generateFlashcardsFromText(text, count = 10) {
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 30 && s.length < 200);

  const flashcards = [];
  const usedSentences = new Set();

  // Key terms extraction (simple)
  const keyTermPatterns = [
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g, // Capitalized phrases
    /(?:is defined as|refers to|means|called)\s+([A-Za-z\s]+)/gi,
    /(concept|definition|theory|principle|method|technique|approach|strategy|framework)/gi,
  ];

  for (let i = 0; i < Math.min(count, sentences.length); i++) {
    const sentence = sentences[i];
    if (usedSentences.has(sentence)) continue;

    let front = '';
    let back = '';

    // Try to extract a key term from the sentence
    for (const pattern of keyTermPatterns) {
      const match = sentence.match(pattern);
      if (match && match[0]) {
        const term = match[0].replace(/^(?:is defined as|refers to|means|called)\s+/i, '').trim();
        if (term.length > 2 && term.length < 50) {
          front = term;
          back = sentence;
          break;
        }
      }
    }

    // Fallback: use first few words as front
    if (!front) {
      const words = sentence.split(' ');
      if (words.length >= 3) {
        front = words.slice(0, Math.min(4, Math.floor(words.length / 2))).join(' ');
        back = sentence;
      } else {
        continue;
      }
    }

    usedSentences.add(sentence);
    flashcards.push({ front, back });
  }

  return flashcards;
}

// Create flashcard manually
router.post('/create', authenticate, [
  body('front').notEmpty().trim(),
  body('back').notEmpty().trim(),
  body('category').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { front, back, category, textbookId } = req.body;

    const flashcard = new Flashcard({
      userId: req.userId,
      textbookId: textbookId || null,
      front,
      back,
      category: category || '',
    });

    await flashcard.save();

    res.status(201).json({
      message: 'Flashcard created successfully',
      flashcard,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate flashcards from textbook
router.post('/generate', authenticate, [
  body('textbookId').isMongoId(),
  body('count').optional().isInt({ min: 1, max: 20 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { textbookId, count = 10 } = req.body;

    const textbook = await Textbook.findOne({
      _id: textbookId,
      userId: req.userId,
    });

    if (!textbook) {
      return res.status(404).json({ message: 'Textbook not found' });
    }

    const flashcardsData = generateFlashcardsFromText(textbook.extractedText, count);

    const flashcards = await Flashcard.insertMany(
      flashcardsData.map(fc => ({
        userId: req.userId,
        textbookId: textbookId,
        front: fc.front,
        back: fc.back,
        category: '',
      }))
    );

    res.status(201).json({
      message: `Generated ${flashcards.length} flashcards`,
      flashcards,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating flashcards' });
  }
});

// Get user's flashcards
router.get('/', authenticate, async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ userId: req.userId })
      .sort({ createdAt: -1 });
    res.json(flashcards);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
