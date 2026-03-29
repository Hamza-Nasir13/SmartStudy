const express = require('express');
const router = express.Router();
const Textbook = require('../models/Textbook');
const pdfParse = require('pdf-parse');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for file uploads - use memory storage
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
  limits: { fileSize: 300 * 1024 * 1024 }, // 300MB limit
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

// Handle multer errors (file too large, etc.)
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large. Maximum size is 50MB.' });
    }
    return res.status(400).json({ message: err.message });
  }
  next(err);
};

// Upload textbook
router.post('/upload', authenticate, upload.single('file'), handleMulterError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Extract text from PDF (using memory buffer)
    let extractedText;
    try {
      const data = await pdfParse(req.file.buffer);
      extractedText = data.text;
      console.log(`PDF text extraction successful for ${req.file.originalname}:`, {
        textLength: extractedText.length,
        preview: extractedText.substring(0, 200) + '...'
      });
    } catch (pdfErr) {
      console.error('PDF parse error:', pdfErr);
      return res.status(400).json({
        message: 'Failed to parse PDF. The file may be corrupted, password-protected, or image-based with no selectable text.'
      });
    }

    if (!extractedText || extractedText.trim().length === 0) {
      console.error('No text extracted from PDF:', req.file.originalname);
      return res.status(400).json({
        message: 'No text could be extracted from this PDF. The file may be an image-based or scanned PDF that requires OCR.'
      });
    }

    // Upload PDF to Cloudinary
    let filePath;
    try {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'raw',
            folder: 'smartstudy/textbooks',
            public_id: Date.now() + '-' + req.file.originalname.replace(/\.[^/.]+$/, ''),
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.file.buffer);
      });
      filePath = uploadResult.secure_url;
    } catch (cloudErr) {
      console.error('Cloudinary upload error:', cloudErr);
      return res.status(500).json({ message: 'Failed to upload file to cloud storage' });
    }

    const textbook = new Textbook({
      userId: req.userId,
      title,
      filename: req.file.originalname,
      filePath, // Cloudinary URL
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
        filePath,
      },
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({
      message: 'Error processing file',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
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
