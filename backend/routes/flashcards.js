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

// Generate flashcards from textbook text using definition extraction
function generateFlashcardsFromText(text, count = 10) {
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 30 && s.length < 250); // Slightly longer max for definitions

  const flashcards = [];
  const usedSentences = new Set();

  // Blacklist of vague/meaningless terms that should never be flashcard fronts
  const VAGUE_TERMS = new Set([
    'users', 'user', 'customers', 'customer', 'people', 'website', 'web site',
    'short', 'long', 'high', 'low', 'many', 'few', 'some', 'various',
    'broad', 'narrow', 'big', 'small', 'good', 'bad', 'best', 'worst',
    'click', 'search', 'result', 'results', 'page', 'pages', 'site',
    'information', 'data', 'content', 'material', 'thing', 'things',
    'the', 'a', 'an', 'this', 'that', 'these', 'those', 'it', 'they',
    'seo', 'cpc', 'ppc', 'mofu', 'tofu', 'bofu' // Acronyms alone are too vague without explanation
  ]);

  // Helper: Check if a term is too vague
  function isVagueTerm(term) {
    const lower = term.toLowerCase();
    if (VAGUE_TERMS.has(lower)) return true;
    if (term.length < 4) return true; // Very short words are usually too vague
    if (/^\d+$/.test(term)) return true; // Just a number
    return false;
  }

  // Helper: Extract complete noun phrase from start of sentence up to a definition connector
  // This handles cases like: "Short-tail keywords are..." -> extract "Short-tail keywords"
  function extractTerm(sentence) {
    // Pattern 1: Term (is/means/are/was/were/refers to/called/defined as) definition
    const pattern1 = /^([A-Z][a-z0-9]+(?:[-'][A-Z][a-z0-9]+)*\s+(?:and|or|with|in|of|for|to|the|a|an|is|are|was|were|means|refers\s+to|called|defined\s+as)\b)/i;
    // Actually, let's get just the subject noun phrase before the verb
    const subjectPattern = /^([A-Z][a-z0-9]+(?:[-'][A-Z][a-z0-9]+)*(?:\s+(?:[a-z]+|and|or|with|in|of|for|to|the|a|an)){0,4})\s+(?:is|are|was|were|means|refers\s+to|called|defined\s+as|=|:|-|–)\b/i;

    // Pattern 2: Term: definition or Term - definition or Term = definition
    const pattern2 = /^([A-Z][a-z0-9]+(?:[-'][A-Z][a-z0-9]+)*(?:\s+(?:[a-z]+|and|or|with|in|of|for|to|the|a|an)){0,4})\s*[:=–-]\s*/i;

    let match = sentence.match(subjectPattern);
    if (!match) {
      match = sentence.match(pattern2);
    }

    if (match) {
      let term = match[1].trim();
      // Clean up trailing words like "the", "a", "an" if present
      term = term.replace(/\s+(the|a|an)$/i, '').trim();
      return term;
    }

    return null;
  }

  // Helper: Check if sentence is a definition (has definition connector)
  function isDefinitionSentence(sentence) {
    const definitionConnectors = /\b(is|are|was|were|means|refers\s+to|called|defined\s+as|[:=–-])\b/i;
    return definitionConnectors.test(sentence);
  }

  // Process sentences
  for (const sentence of sentences) {
    if (usedSentences.has(sentence)) continue;
    if (!isDefinitionSentence(sentence)) continue;

    const term = extractTerm(sentence);
    if (!term) continue;

    // Validate term
    if (term.length < 3 || term.length > 50) continue;
    if (isVagueTerm(term)) continue;
    const termWords = term.split(/\s+/);
    if (termWords.length > 5) continue; // Too long for a "term"

    // Ensure the definition actually explains the term (not just repeating it)
    // Check that the definition portion contains more than just the term
    const definitionPart = sentence.substring(sentence.indexOf(term) + term.length);
    if (definitionPart.trim().length < term.length) continue; // Definition too short

    usedSentences.add(sentence);
    flashcards.push({ front: term, back: sentence });

    if (flashcards.length >= count) break;
  }

  console.log('Flashcard generation stats:', {
    totalSentences: sentences.length,
    definitionSentences: sentences.filter(isDefinitionSentence).length,
    flashcardsCreated: flashcards.length,
  });

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
    console.log('Delete flashcard request:', { id: req.params.id, userId: req.userId });

    const flashcard = await Flashcard.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!flashcard) {
      console.log('Flashcard not found or unauthorized:', { id: req.params.id, userId: req.userId });
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
