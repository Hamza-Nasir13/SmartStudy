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
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✓ SET' : '✗ NOT SET');
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✓ SET' : '✗ NOT SET');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✓ SET' : '✗ NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('PORT:', process.env.PORT || '5000 (default)');
console.log('========================');

const app = express();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // allow mobile apps / postman
    if (!origin) return callback(null, true);

    // allow all Vercel preview deployments
    if (origin.includes(".vercel.app")) {
      return callback(null, true);
    }

    // allow production frontend (optional safety check)
    if (origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  console.error('⚠️  Server will continue to run, but database operations will fail');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/textbooks', require('./routes/textbooks'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/flashcards', require('./routes/flashcards'));
app.use('/api/payment', require('./routes/payment'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});
