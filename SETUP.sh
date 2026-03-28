#!/bin/bash

# SmartStudy Quick Setup Script
# Run this script to set up the complete MVP

echo "🚀 Setting up SmartStudy MVP..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16+ and try again."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Backend dependencies failed to install"
        exit 1
    fi
    echo "✅ Backend dependencies installed"
else
    echo "✅ Backend dependencies already installed"
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Creating .env file from .env.example..."
    cp .env.example .env
    echo "   ⚠️  IMPORTANT: Edit backend/.env with your MongoDB connection string!"
fi

cd ..

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Frontend dependencies failed to install"
        exit 1
    fi
    echo "✅ Frontend dependencies installed"
else
    echo "✅ Frontend dependencies already installed"
fi
cd ..

echo ""
echo "✨ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Ensure MongoDB is running (local or Atlas)"
echo "2. Edit backend/.env with your MongoDB URI and JWT_SECRET"
echo "3. Start the backend: cd backend && npm run dev"
echo "4. In a new terminal, start the frontend: cd frontend && npm start"
echo ""
echo "🌐 App will be available at: http://localhost:3000"
echo "🔌 Backend API at: http://localhost:5000"
echo ""
echo "📚 See README.md for detailed documentation"
echo "💰 See VC_PITCH.md for business pitch"
echo ""
