import React from 'react';
import { Link } from 'react-router-dom';

const Home = ({ user, isAuthenticated }) => {
  return (
    <div>
      <section className="hero">
        <h1>SmartStudy</h1>
        <p>Transform your textbooks into personalized quizzes and flashcards</p>
        <div className="hero-actions">
          {isAuthenticated ? (
            <>
              <Link to="/upload" className="btn btn-primary">
                Get Started
              </Link>
              <Link to="/quizzes" className="btn btn-outline" style={{ marginLeft: '0.75rem' }}>
                Create Quiz
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary">
                Start Learning
              </Link>
              <Link to="/upload" className="btn btn-outline" style={{ marginLeft: '0.75rem' }}>
                Upload Textbook
              </Link>
            </>
          )}
        </div>
      </section>

      <div className="container">
        <div className="grid grid-4">
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

          <div className="card feature-card">
            <div className="feature-icon">💰</div>
            <h3>View Pricing</h3>
            <p>See our free and premium plans to choose what's right for your study needs.</p>
          </div>
        </div>

        <div className="card">
          <h2>How It Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Upload</h3>
                <p>Upload your textbook in PDF format</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Process</h3>
                <p>Our system extracts and analyzes the text content</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Generate</h3>
                <p>Create quizzes and flashcards from the extracted content</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Study</h3>
                <p>Use the generated materials to prepare for your exams</p>
              </div>
            </div>
          </div>
        </div>

        {isAuthenticated && (
          <div className="card">
            <h2>Ready to Start Studying?</h2>
            <p>Upload your first textbook or create a quiz from existing content.</p>
            <div className="action-buttons">
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
