const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const Textbook = require('../models/Textbook');
const fs = require('fs');
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

// Simple keyword-based quiz generation
function generateQuizFromText(text, title, topic = '') {
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);

  // Extract potential keywords/phrases (simple approach)
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 4);

  const wordFreq = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  const keywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(entry => entry[0]);

  const questions = [];
  const usedConcepts = new Set();

  for (let i = 0; i < Math.min(10, sentences.length); i++) {
    const sentence = sentences[i];

    // Find keywords in this sentence
    const sentenceLower = sentence.toLowerCase();
    const foundKeywords = keywords.filter(k => sentenceLower.includes(k));

    if (foundKeywords.length === 0 || usedConcepts.has(sentence)) continue;

    const correctKeyword = foundKeywords[0];
    usedConcepts.add(sentence);

    // Generate wrong options from other keywords
    const wrongOptions = keywords
      .filter(k => k !== correctKeyword)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const options = [correctKeyword, ...wrongOptions].sort(() => Math.random() - 0.5);

    questions.push({
      question: `What concept is being described: "${sentence.substring(0, 100)}..."?`,
      options,
      correctAnswer: options.indexOf(correctKeyword),
      explanation: `The answer is ${correctKeyword}. This term appears frequently in this topic.`,
    });
  }

  return {
    title: title || `Quiz on ${topic || 'Study Material'}`,
    questions: questions.slice(0, 5), // Limit to 5 questions for MVP
    topic,
  };
}

// Generate quiz from textbook
router.post('/generate', authenticate, [
  body('textbookId').optional().isMongoId(),
  body('text').optional().isString().trim(),
  body('title').notEmpty().trim(),
  body('topic').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    console.log('Validation errors:', errors.array());
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { textbookId, text: directText, title, topic } = req.body;

    // Check that at least one source is provided
    if (!textbookId && (!directText || directText.trim() === '')) {
      return res.status(400).json({
        errors: [{
          msg: 'Either textbookId or text must be provided',
          param: 'textbookId',
          location: 'body'
        }]
      });
    }

    let text = directText;
    let finalTextbookId = textbookId;

    // If textbookId provided, fetch textbook text
    if (textbookId) {
      const textbook = await Textbook.findOne({
        _id: textbookId,
        userId: req.userId,
      });

      if (!textbook) {
        return res.status(404).json({ message: 'Textbook not found' });
      }

      text = textbook.extractedText;
      finalTextbookId = textbook._id;
    }

    if (!text || text.length < 50) {
      console.error('Insufficient text content for quiz generation:', {
        textbookId: finalTextbookId,
        source: textbookId ? 'textbook' : 'direct text',
        textLength: text?.length || 0,
        textPreview: text?.substring(0, 200) || 'none'
      });
      return res.status(400).json({
        message: 'Insufficient text content. The textbook may be image-based, scanned, or have very little selectable text. Try a different textbook.',
      });
    }

    console.log('Generating quiz from text:', {
      textbookId: finalTextbookId,
      textLength: text.length,
      title: req.body.title,
      topic: req.body.topic
    });

    const quizData = generateQuizFromText(text, req.body.title, req.body.topic);

    const quiz = new Quiz({
      userId: req.userId,
      textbookId: finalTextbookId || null,
      title: quizData.title,
      questions: quizData.questions,
      topic: quizData.topic,
    });

    await quiz.save();

    res.status(201).json({
      message: 'Quiz generated successfully',
      quiz,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating quiz' });
  }
});

// Get user's quizzes
router.get('/', authenticate, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ userId: req.userId })
      .sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
