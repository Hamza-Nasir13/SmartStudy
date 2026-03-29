const express = require('express');
const router = express.Router();
const Textbook = require('../models/Textbook');
const pdfParse = require('pdf-parse');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for file uploads - use disk storage to avoid memory issues
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024
  }, // Default 10MB (Cloudinary free tier), increase if you have paid plan
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
      const maxSizeMB = (parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024) / (1024 * 1024);
      return res.status(400).json({
        message: `File is too large. Maximum size is ${maxSizeMB.toFixed(0)}MB.`
      });
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

    console.log(`Processing upload: ${req.file.originalname} (${(req.file.size / (1024 * 1024)).toFixed(2)}MB)`);
    const tempFilePath = req.file.path;

    let extractedText;
    let filePath = null;

    try {
      // Step 1: Extract text from PDF
      console.log('Starting PDF text extraction...');
      try {
        const data = await pdfParse(tempFilePath);
        extractedText = data.text;
      } catch (pdfErr) {
        console.error('PDF parse error (first attempt):', pdfErr);
        // Fallback: try reading the file into buffer
        console.log('Retrying with buffer method...');
        const fileBuffer = fs.readFileSync(tempFilePath);
        const data = await pdfParse(fileBuffer);
        extractedText = data.text;
      }

      console.log(`PDF text extraction successful for ${req.file.originalname}:`, {
        textLength: extractedText.length,
        preview: extractedText.substring(0, 200) + '...'
      });

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from PDF');
      }

      // Step 2: Upload PDF to Cloudinary - stream from disk
      console.log('Starting Cloudinary upload...');
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'raw',
            folder: 'smartstudy/textbooks',
            public_id: Date.now() + '-' + req.file.originalname.replace(/\.[^/.]+$/, ''),
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary stream error:', error);
              reject(error);
            } else {
              console.log('Cloudinary upload successful:', result.secure_url);
              resolve(result);
            }
          }
        );
        // Stream the file from disk
        const fileStream = fs.createReadStream(tempFilePath);
        fileStream.pipe(stream);
      });
      filePath = uploadResult.secure_url;

      // Step 3: Save textbook to database
      const textbook = new Textbook({
        userId: req.userId,
        title,
        filename: req.file.originalname,
        filePath,
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

      // Determine error type and respond accordingly
      if (err.message === 'No text could be extracted from PDF') {
        return res.status(400).json({
          message: 'No text could be extracted from this PDF. The file may be an image-based or scanned PDF that requires OCR.'
        });
      }

      return res.status(500).json({
        message: 'Failed to upload file to cloud storage. The file may be too large or there may be a network issue.',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    } finally {
      // Clean up temp file - ensure it's deleted after ALL operations
      if (fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
          console.log(`Cleaned up temp file: ${tempFilePath}`);
        } catch (unlinkErr) {
          console.error('Failed to delete temp file:', unlinkErr);
        }
      }
    }

    const textbook = new Textbook({
      userId: req.userId,
      title,
      filename: req.file.originalname,
      filePath, // Cloudinary URL
      extractedText,
    });

    await textbook.save();

    // Send success response and RETURN to prevent further execution
    return res.status(201).json({
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

    // Only send error response if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(500).json({
        message: 'Error processing file',
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      });
    } else {
      // Headers already sent, cannot respond to client
      console.error('Cannot send error response - headers already sent');
    }
    res.status(500).json({
      message: 'Error processing file',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
});

// Delete textbook
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const textbook = await Textbook.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!textbook) {
      return res.status(404).json({ message: 'Textbook not found' });
    }

    // Delete from Cloudinary if filePath exists and is a Cloudinary URL
    if (textbook.filePath && textbook.filePath.includes('cloudinary')) {
      try {
        // Extract public_id from URL
        // URL format: https://res.cloudinary.com/cloud_name/raw/upload/v1234567890/folder/filename
        const urlParts = textbook.filePath.split('/');
        const publicId = urlParts.slice(-2).join('/'); // Get folder/filename

        console.log('Deleting file from Cloudinary:', publicId);
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        console.log('Cloudinary file deleted successfully');
      } catch (cloudErr) {
        console.error('Failed to delete file from Cloudinary:', cloudErr);
        // Continue with database deletion even if Cloudinary delete fails
      }
    }

    await Textbook.findByIdAndDelete(req.params.id);

    console.log('Textbook deleted:', textbook._id);
    res.json({ message: 'Textbook deleted successfully' });
  } catch (err) {
    console.error('Delete textbook error:', err);
    res.status(500).json({
      message: 'Error deleting textbook',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
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
