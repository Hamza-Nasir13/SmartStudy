const express = require('express');
const router = express.Router();
const Textbook = require('../models/Textbook');
const pdfParse = require('pdf-parse');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const jwt = require('jsonwebtoken');

// Configure multer for file uploads - use memory storage (no disk writes)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

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

// Upload textbook
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Extract text from PDF (using memory buffer)
    const data = await pdfParse(req.file.buffer);
    const extractedText = data.text;

    const textbook = new Textbook({
      userId: req.userId,
      title,
      filename: req.file.originalname,
      filePath: null, // Not storing PDF on disk
      extractedText,
    });

    await textbook.save();

    res.status(201).json({
      message: 'Textbook uploaded successfully',
      textbook: {
        id: textbook._id,
        title: textbook.title,
        filename: textbook.filename,
        textLength: extractedText.length,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error processing file' });
  }
});

// Get user's textbooks
router.get('/', authenticate, async (req, res) => {
  try {
    const textbooks = await Textbook.find({ userId: req.userId })
      .sort({ uploadedAt: -1 });
    res.json(textbooks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single textbook
router.get('/:id', authenticate, async (req, res) => {
  try {
    const textbook = await Textbook.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!textbook) {
      return res.status(404).json({ message: 'Textbook not found' });
    }

    res.json(textbook);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
