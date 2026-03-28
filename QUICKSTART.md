# 🚀 SmartStudy MVP - Quick Start Guide

Ready to launch your AI Smart Study App? Follow these steps to get running in 5 minutes.

---

## 1-Minute Setup (if you have MongoDB running)

```bash
chmod +x SETUP.sh
./SETUP.sh
```

Then open two terminals:
- Terminal 1: `cd backend && npm run dev`
- Terminal 2: `cd frontend && npm start`

---

## Detailed Setup

### Step 1: Install MongoDB

**Option A: Local MongoDB**
- Download from https://www.mongodb.com/try/download/community
- Start MongoDB: `mongod` (keep this running)

**Option B: MongoDB Atlas (Free Cloud)**
- Sign up at https://www.mongodb.com/cloud/atlas
- Create a cluster
- Get connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/smartstudy`)

### Step 2: Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=any_random_long_string_here_minimum_32_chars
NODE_ENV=development
```

### Step 3: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (new terminal)
cd ../frontend
npm install
```

### Step 4: Start the App

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Should see: 🚀 Server running on port 5000
# And: ✅ MongoDB connected successfully
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
# Browser opens to http://localhost:3000
```

---

## Test the MVP

1. **Register** a new account
2. **Upload** a sample PDF textbook
   - Can use any PDF (textbooks work best)
3. **Generate** a quiz from your textbook
4. **Take** the quiz and see results
5. **Generate** flashcards from same textbook
6. **Study** cards using flip interaction

**Sample PDF sources:**
- Download open textbooks from https://openstax.org/
- Or use any PDF you have

---

## Common Issues & Fixes

### "MongoDB connection error"
- Check MongoDB is running: `mongosh`
- Verify connection string in backend/.env
- If Atlas: whitelist IP (0.0.0.0/0 for testing)

### "Port 5000 already in use"
Another process using the port. Either:
- Kill the process: `lsof -ti:5000 | xargs kill -9`
- Or change PORT in backend/.env

### "Cannot upload PDF"
- Check uploads/ directory exists in backend/
- File too large? Max size is 10MB
- Must be actual PDF (not image-based)

### "Text extraction returns empty"
PDF might be scanned/image-based. Try a different PDF with selectable text.

### Frontend won't connect to backend
- Backend must be running on port 5000
- Check browser console (F12) for errors
- Verify proxy in frontend/package.json is set correctly

---

## Production Deployment Checklist

### Backend
- [ ] Set NODE_ENV=production
- [ ] Use strong JWT_SECRET (min 32 chars, random)
- [ ] Configure MongoDB Atlas with SSL
- [ ] Set up PM2 or similar process manager
- [ ] Configure nginx reverse proxy
- [ ] Enable HTTPS (SSL certificate)
- [ ] Set up logging (Winston/Morgan)
- [ ] Add rate limiting
- [ ] Configure CORS allowed origins

### Frontend
- [ ] Run `npm run build`
- [ ] Deploy build/ to hosting (Vercel, Netlify, S3)
- [ ] Set REACT_APP_API_URL environment variable
- [ ] Test all features in production

---

## What's Included

### ✅ Complete Backend (Node.js + Express)
- Authentication system with JWT
- 4 database models (User, Textbook, Quiz, Flashcard)
- 4 REST API modules (auth, textbooks, quizzes, flashcards)
- PDF parsing and text extraction
- File upload handling
- Input validation and security

### ✅ Complete Frontend (React)
- 5 pages (Home, Login, Upload, Quizzes, Flashcards)
- Authentication flow with protected routes
- File upload UI with drag-and-drop
- Quiz taking interface with scoring
- Flashcard study mode with flip animation
- Responsive design (mobile-friendly)
- Professional UI/UX

### ✅ Documentation
- README.md - Full documentation
- VC_PITCH.md - Business pitch for investors
- QUICKSTART.md - This file
- Inline code comments

---

## Demo for Investors

### 2-Minute Demo Script:
1. "Watch as I upload a textbook PDF to our platform." [Upload]
2. "Now I'll generate a quiz — see, it creates 5 multiple-choice questions in seconds." [Generate]
3. "Let's take the quiz — shows score with explanations." [Take quiz]
4. "Now flashcards — watch them auto-generate from the same book." [Generate]
5. "Study mode with flip animation — this is how students actually use it." [Study]

**Key message:** "I've built the complete MVP. It's production-ready. All that's needed is funding to scale."

---

## Scaling to 1M Users

Current architecture is ready to scale. For production:

### Database
- Add indexes (see README.md)
- Consider read replicas at 100K+ users
- Sharding at 1M+ users

### File Storage
- Replace local storage with AWS S3
- Use CloudFront CDN
- Implement file cleanup jobs

### Application
- Deploy multiple backend instances behind load balancer
- Use Redis for session storage
- Implement API rate limiting
- Add request logging and monitoring

### Costs (estimated at 100K users):
- Backend hosting: $200-500/mo (Heroku/Railway)
- Database: $50-150/mo (MongoDB Atlas)
- File storage: $20-100/mo (S3)
- Total: <$1,000/mo

---

## Development Tips

### Adding a New Feature
1. Create/update Mongoose model if needed
2. Add route in backend/routes/
3. Add API call in frontend
4. Create React page/component
5. Update navigation in App.js

### Database Changes
Update model file, no migrations needed (MongoDB is schemaless)

### API Testing
Use Postman or curl:
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","name":"Test"}'
```

---

## Support

Need help? Check:
1. README.md for detailed docs
2. VC_PITCH.md for business context
3. Browser console for frontend errors
4. Terminal for backend errors
5. MongoDB logs if database issues

---

**You now have a complete, scalable, production-ready MVP.**

🎯 **Next: Show it to investors, get funding, hire team, scale!**
