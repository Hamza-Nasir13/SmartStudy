const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

// Debug: Check environment variables
console.log('=== ENVIRONMENT DEBUG ===');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✓ SET' : '✗ NOT SET');
console.log('MONGODB_URI (first 50 chars):', process.env.MONGODB_URI?.substring(0, 50) + '...' || 'none');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓ SET' : '✗ NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('========================');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/textbooks', require('./routes/textbooks'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/flashcards', require('./routes/flashcards'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
