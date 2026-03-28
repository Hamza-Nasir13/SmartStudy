# 📚 SmartStudy - AI-Powered Study App MVP

Transform any textbook PDF into quizzes and flashcards in seconds. The complete MVP ready for VC pitch and production deployment.

---

## 🚀 Quick Start

**Want to see it in action?** You can have the app running locally in under 5 minutes.

### Prerequisites
- Node.js (v16 or higher)
- MongoDB running locally or cloud instance
- Git

### Installation

1. **Clone and setup**
   ```bash
   git clone <your-repo-url>
   cd SmartStudy
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your MongoDB connection string and JWT secret
   npm run dev
   ```
   Server runs on http://localhost:5000

3. **Frontend Setup** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm start
   ```
   App runs on http://localhost:3000

4. **Open the app**
   Visit http://localhost:3000 in your browser

---

## 📖 Features

### Core Functionality

1. **📄 PDF Upload & Text Extraction**
   - Upload any textbook PDF (up to 10MB)
   - Automatic text extraction and processing
   - Store multiple textbooks per user
   - View all uploaded textbooks

2. **🧠 Quiz Generation**
   - Generate 5-question multiple-choice quizzes from textbook content
   - Keyword-based question generation (proven pedagogical approach)
   - Instant feedback with explanations
   - Score tracking and performance metrics
   - Option to paste custom text or use uploaded textbook

3. **🎴 Flashcard Creation**
   - Manually create custom flashcards
   - Auto-generate flashcards from textbook content
   - Interactive card-flipping study mode
   - Category organization
   - Browse and delete flashcards

4. **🔐 User Authentication**
   - Secure email/password registration and login
   - JWT-based stateless authentication
   - Cloud sync of all study materials
   - Session persistence across devices

5. **🎨 Modern UI/UX**
   - Clean, responsive design (mobile, tablet, desktop)
   - Intuitive navigation
   - Real-time feedback (loading states, success/error messages)
   - Professional gradient design theme
   - Accessible interface

---

## 🏗️ Architecture

### Tech Stack

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose ODM
- JWT for authentication
- PDF parsing with pdf-parse
- Multer for file uploads
- Express Validator for input validation
- Helmet.js for security headers

**Frontend:**
- React 18
- React Router v6 for navigation
- Axios for API communication
- CSS3 with Flexbox/Grid

### Project Structure

```
SmartStudy/
├── backend/
│   ├── models/          # Mongoose models
│   │   ├── User.js
│   │   ├── Textbook.js
│   │   ├── Quiz.js
│   │   └── Flashcard.js
│   ├── routes/          # API endpoints
│   │   ├── auth.js
│   │   ├── textbooks.js
│   │   ├── quizzes.js
│   │   └── flashcards.js
│   ├── uploads/         # Uploaded PDF files
│   ├── server.js        # Express server entry point
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.js
│   │   │   ├── Login.js
│   │   │   ├── Upload.js
│   │   │   ├── Quizzes.js
│   │   │   └── Flashcards.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   └── package-lock.json
│
├── README.md
└── VC_PITCH.md
```

---

## 🔌 API Reference

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | User login |

### Textbooks
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/textbooks` | GET | Get user's textbooks |
| `/api/textbooks/upload` | POST | Upload PDF textbook |

### Quizzes
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/quizzes` | GET | Get user's quizzes |
| `/api/quizzes/generate` | POST | Generate quiz from textbook or text |

### Flashcards
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/flashcards` | GET | Get user's flashcards |
| `/api/flashcards/create` | POST | Create manual flashcard |
| `/api/flashcards/generate` | POST | Generate from textbook |

---

## 🎯 User Flow

```
1. Register/Login
   ↓
2. Upload Textbook (PDF)
   ↓
3. Choose Action:
   ├── Generate Quiz → Take Quiz → Review Results
   └── Generate Flashcards → Study Mode → Flip Cards
   ↓
4. Track Progress
   ↓
5. Repeat with next textbook
```

---

## 🧪 Testing the Application

### Manual Testing Checklist

**Authentication:**
- [ ] Register new user
- [ ] Login with credentials
- [ ] Logout and verify redirect
- [ ] Try accessing protected routes while logged out

**Upload:**
- [ ] Upload a sample PDF (any PDF textbook)
- [ ] Verify text extraction (check text length)
- [ ] View uploaded textbook in list

**Quiz Generation:**
- [ ] Generate quiz from uploaded textbook
- [ ] Answer all questions
- [ ] Submit and verify scoring
- [ ] View correct answers with explanations

**Flashcards:**
- [ ] Create manual flashcard
- [ ] Generate flashcards from textbook
- [ ] Enter study mode and flip cards
- [ ] Navigate between cards
- [ ] Delete a flashcard

---

## 🎨 Design System

### Color Palette
- **Primary:** `#4f46e5` (Indigo)
- **Secondary:** `#6b7280` (Gray)
- **Success:** `#059669` (Green)
- **Error:** `#dc2626` (Red)
- **Background:** `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`

### Typography
- **Font:** System fonts (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto)
- **Headings:** Bold, weights 600-700
- **Body:** Regular, 16px base

### Components
- Cards with border-radius 12px
- Buttons with 8px border-radius
- Input fields with 2px border focus change
- Navigation sticky with backdrop blur

---

## 🚢 Deployment Guide

### Backend (Heroku / Railway / Render)

1. **Create MongoDB Atlas cluster** (free tier)
   - Get connection string
   - Whitelist all IPs for testing

2. **Set environment variables:**
   ```
   PORT=5000
   MONGODB_URI=<your-atlas-uri>
   JWT_SECRET=<secure-random-string>
   NODE_ENV=production
   ```

3. **Deploy to Heroku:**
   ```bash
   heroku create smartstudy-backend
   git subtree push --prefix backend heroku main
   ```

### Frontend (Vercel / Netlify)

1. **Build the React app:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

3. **Update frontend environment:**
   Set `REACT_APP_API_URL` to your backend URL in Vercel dashboard

---

## 🔒 Security Considerations

### Implemented:
- Password hashing with bcrypt (10 salt rounds)
- JWT authentication with expiration (7 days)
- Helmet.js security headers
- Input validation with express-validator
- File upload restrictions (PDF only, 10MB limit)
- CORS configured

### For Production:
- Use HTTPS everywhere
- Set strong JWT_SECRET in production
- Implement rate limiting
- Add CSRF protection
- Regular security audits
- Audit logging
- Secure MongoDB connection with SSL

---

## 📈 Scaling Considerations

### Database:
- Add indexes on frequently queried fields:
  ```javascript
  Textbook: { userId: 1, uploadedAt: -1 }
  Quiz: { userId: 1, createdAt: -1 }
  Flashcard: { userId: 1, createdAt: -1 }
  ```

### File Storage:
- Current: Local filesystem (development)
- Production: AWS S3 / Cloudinary / Azure Blob
- Implement CDN for faster downloads

### Caching:
- Redis for session storage
- CDN caching for static assets
- Query result caching for frequent textbook queries

### Load Balancing:
- Deploy multiple backend instances
- Use PM2 or Docker for process management
- Configure reverse proxy (nginx)

---

## 🧩 Future Enhancements

### Phase 2 (Advanced Features):
- **Machine Learning quiz generation:** NLP-based question creation
- **Spaced repetition algorithm:** Scientifically-proven retention scheduling
- **Progress analytics:** Dashboard showing strengths/weaknesses
- **Social features:** Share decks, study groups
- **LMS integrations:** Canvas, Blackboard, Moodle

### Phase 3 (AI Features):
- **AI tutor chatbot:** Answer questions about textbook content
- **Voice-based flashcards:** Audio support
- **Image recognition:** Upload diagrams and charts
- **Personalization:** Adaptive difficulty based on performance

### Phase 4 (Enterprise):
- **Bulk upload:** Multiple textbooks at once
- **Admin dashboard:** Teacher/class management
- **Single sign-on:** Google, Microsoft OAuth
- **API access:** White-label integrations

---

## 🐛 Troubleshooting

### Backend won't start
- Check MongoDB is running: `mongod`
- Verify .env file exists and has correct values
- Check port 5000 is available

### PDF upload fails
- File must be PDF under 10MB
- Check uploads/ directory exists and is writable
- Verify multer configuration

### Frontend can't connect to backend
- Check backend is running on port 5000
- Verify proxy setting in frontend/package.json
- Check browser console for CORS errors

### PDF text extraction returns empty string
- PDF might be scanned/image-based (OCR needed)
- Try a different PDF file
- Check console logs for parsing errors

---

## 📚 Learning Resources

This project demonstrates:
- **Full-stack JavaScript** development
- **RESTful API** design patterns
- **Authentication** with JWT
- **File upload** handling
- **MongoDB** with Mongoose
- **React** state management and routing
- **Responsive CSS** design

Great for learning production-ready architecture!

---

## 📄 License

MIT License - Feel free to use, modify, and distribute for learning purposes.

---

## 🙋 Support

Found a bug? Have a feature request? Open an issue in this repository!

---

**Built with ❤️ for students everywhere**

**Status:** ✅ MVP Complete & Production-Ready | 🎯 Targeting VC Funding
