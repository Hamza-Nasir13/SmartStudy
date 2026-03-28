import React from 'react';
import { Link } from 'react-router-dom';

const Home = ({ user, isAuthenticated }) => {
  return (
    <div>
      <section className="hero">
        <h1>🎓 SmartStudy</h1>
        <p>Transform your textbooks into personalized quizzes and flashcards powered by AI</p>
        {isAuthenticated ? (
          <Link to="/upload" className="btn btn-primary" style={{ marginRight: '1rem' }}>
            Get Started
          </Link>
        ) : (
          <Link to="/login" className="btn btn-primary" style={{ marginRight: '1rem' }}>
            Start Learning
          </Link>
        )}
      </section>

      <div className="container">
        <div className="grid grid-3">
          <div className="card feature-card">
            <div className="feature-icon">📚</div>
            <h3>Upload Textbooks</h3>
            <p>Simply upload your PDF textbooks and let our system extract and process the content automatically.</p>
          </div>

          <div className="card feature-card">
            <div className="feature-icon">🧠</div>
            <h3>Generate Quizzes</h3>
            <p>Create multiple-choice quizzes from your textbook content to test your understanding of key concepts.</p>
          </div>

          <div className="card feature-card">
            <div className="feature-icon">🎴</div>
            <h3>Build Flashcards</h3>
            <p>Generate or create flashcards for efficient memorization of important terms and definitions.</p>
          </div>
        </div>

        <div className="card" style={{ marginTop: '2rem' }}>
          <h2>How It Works</h2>
          <ol style={{ paddingLeft: '2rem', marginTop: '1rem' }}>
            <li style={{ marginBottom: '1rem' }}>
              <strong>Upload:</strong> Upload your textbook in PDF format
            </li>
            <li style={{ marginBottom: '1rem' }}>
              <strong>Process:</strong> Our system extracts and analyzes the text content
            </li>
            <li style={{ marginBottom: '1rem' }}>
              <strong>Generate:</strong> Create quizzes and flashcards from the extracted content
            </li>
            <li style={{ marginBottom: '1rem' }}>
              <strong>Study:</strong> Use the generated materials to prepare for your exams
            </li>
          </ol>
        </div>

        {isAuthenticated && (
          <div className="card" style={{ textAlign: 'center', marginTop: '2rem' }}>
            <h2>Ready to Start Studying?</h2>
            <p style={{ margin: '1rem 0' }}>Upload your first textbook or create a quiz from existing content.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Link to="/upload" className="btn btn-primary">
                Upload Textbook
              </Link>
              <Link to="/quizzes" className="btn btn-outline">
                Create Quiz
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
