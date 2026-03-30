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

// Generate flashcards from textbook text - improved definition extraction
function generateFlashcardsFromText(text, count = 10) {
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 30 && s.length < 200);

  const flashcards = [];
  const usedSentences = new Set();

  // Patterns that identify a definition structure: "Term is/means/... definition"
  // Captures the term before the definition connector
  const definitionPatterns = [
    // "Term is/means/refers to/called/defined as definition"
    /([A-Z][a-z]+(?: [A-Z][a-z]+)*)\s+(is|are|was|were|means|refers to|called|defined as)\s+[A-Za-z0-9\s,.;:'"-]+/i,
    // "Term: definition" or "Term - definition" or "Term – definition"
    /([A-Z][a-z]+(?: [A-Z][a-z]+)*)[:\s]*[-–]\s*[A-Za-z0-9\s,.;:'"-]+/i,
    /([A-Z][a-z]+(?: [A-Z][a-z]+)*):\s*[A-Za-z0-9\s,.;:'"-]+/i,
    // "Term = definition" (e.g., "Higher CPC = more profitable")
    /([A-Z][a-z]+(?: [A-Z][a-z]+)*)\s*=\s*[A-Za-z0-9\s,.;:'"-]+/i,
  ];

  // Filter sentences that contain a definition pattern
  const candidateSentences = sentences.filter(sentence => {
    return definitionPatterns.some(pattern => pattern.test(sentence));
  });

  console.log('Flashcard generation:', {
    totalSentences: sentences.length,
    candidateSentences: candidateSentences.length,
  });

  // Process candidate sentences to extract term (front) and keep full sentence (back)
  for (let i = 0; i < Math.min(count, candidateSentences.length); i++) {
    const sentence = candidateSentences[i];
    if (usedSentences.has(sentence)) continue;

    let front = '';

    // Find the first pattern that yields a valid term
    for (const pattern of definitionPatterns) {
      const match = sentence.match(pattern);
      if (match) {
        let term = match[1].trim();
        // Validate term: 2-50 chars, 1-5 words
        const termWords = term.split(/\s+/);
        if (term.length >= 2 && term.length <= 50 && termWords.length <= 5) {
          front = term;
          break;
        }
      }
    }

    // If no valid term found, skip this sentence (no fallback to avoid random cards)
    if (!front) continue;

    usedSentences.add(sentence);
    flashcards.push({ front, back: sentence });
  }

  console.log('Flashcards generated:', flashcards.length);
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
      console.error('Textbook not found for flashcard generation:', { textbookId });
      return res.status(404).json({ message: 'Textbook not found' });
    }

    console.log('Generating flashcards from textbook:', {
      textbookId: textbook._id,
      title: textbook.title,
      extractedTextLength: textbook.extractedText?.length || 0,
      count: count
    });

    const flashcardsData = generateFlashcardsFromText(textbook.extractedText, count);

    console.log('Flashcard generation result:', {
      requested: count,
      generated: flashcardsData.length,
      reason: flashcardsData.length === 0 ? 'No valid sentences or key terms found in textbook text' : undefined
    });

    if (flashcardsData.length === 0) {
      return res.status(400).json({
        message: 'Could not generate flashcards. The textbook may not have enough suitable content. Try a different textbook or manually create flashcards.'
      });
    }

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

// Delete flashcard
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const flashcard = await Flashcard.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!flashcard) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }

    await Flashcard.findByIdAndDelete(req.params.id);

    console.log('Flashcard deleted:', req.params.id);
    res.json({ message: 'Flashcard deleted successfully' });
  } catch (err) {
    console.error('Delete flashcard error:', err);
    res.status(500).json({
      message: 'Error deleting flashcard',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;
