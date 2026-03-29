const mongoose = require('mongoose');

const textbookSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  filename: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: false,
  },
  extractedText: {
    type: String,
    default: '',
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Textbook', textbookSchema);
