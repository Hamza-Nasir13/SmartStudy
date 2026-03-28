import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Quizzes = ({ user }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const textbookId = searchParams.get('textbookId');

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(!!textbookId);
  const [formData, setFormData] = useState({
    textbookId: textbookId || '',
    title: '',
    topic: '',
    text: '',
  });
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await axios.get(`${API_URL}/quizzes`);
      setQuizzes(response.data);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setCurrentQuiz(null);

    try {
      const response = await axios.post(`${API_URL}/quizzes/generate`, formData);
      setCurrentQuiz(response.data.quiz);
      setShowForm(false);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Error generating quiz'
      );
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = (quiz) => {
    setCurrentQuiz(quiz);
    setAnswers(new Array(quiz.questions.length).fill(null));
    setShowResults(false);
  };

  const handleAnswer = (questionIndex, answerIndex) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const submitQuiz = () => {
    if (currentQuiz) {
      const score = currentQuiz.questions.reduce((acc, q, idx) => {
        return acc + (answers[idx] === q.correctAnswer ? 1 : 0);
      }, 0);
      setShowResults(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuiz(null);
    setShowResults(false);
    setAnswers([]);
    setShowForm(true);
  };

  const getScoreColor = (score, total) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return '#059669';
    if (percentage >= 60) return '#d97706';
    return '#dc2626';
  };

  if (currentQuiz) {
    return (
      <div className="container" style={{ maxWidth: '800px', marginTop: '2rem' }}>
        <button onClick={() => setCurrentQuiz(null)} className="btn btn-outline" style={{ marginBottom: '1rem' }}>
          ← Back to Quizzes
        </button>

        <div className="card">
          <h2>{currentQuiz.title}</h2>
          {currentQuiz.topic && (
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Topic: {currentQuiz.topic}
            </p>
          )}

          {!showResults ? (
            <>
              {currentQuiz.questions.map((q, qIndex) => (
                <div key={qIndex} style={{ marginBottom: '2rem' }}>
                  <h4 style={{ marginBottom: '1rem' }}>
                    Question {qIndex + 1}: {q.question}
                  </h4>
                  <div>
                    {q.options.map((option, oIndex) => (
                      <div
                        key={oIndex}
                        className={`quiz-option ${answers[qIndex] === oIndex ? 'selected' : ''}`}
                        onClick={() => handleAnswer(qIndex, oIndex)}
                      >
                        {String.fromCharCode(65 + oIndex)}. {option}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={submitQuiz}
                className="btn btn-primary"
                disabled={answers.includes(null)}
              >
                Submit Quiz
              </button>
            </>
          ) : (
            <div>
              <div
                style={{
                  fontSize: '3rem',
                  fontWeight: 'bold',
                  color: getScoreColor(
                    currentQuiz.questions.filter((_, i) => answers[i] === currentQuiz.questions[i].correctAnswer).length,
                    currentQuiz.questions.length
                  ),
                  textAlign: 'center',
                  marginBottom: '2rem',
                }}
              >
                {currentQuiz.questions.filter((_, i) => answers[i] === currentQuiz.questions[i].correctAnswer).length} / {currentQuiz.questions.length}
              </div>

              {currentQuiz.questions.map((q, qIndex) => (
                <div
                  key={qIndex}
                  style={{
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    background: answers[qIndex] === q.correctAnswer ? '#d1fae5' : '#fee2e2',
                    borderRadius: '8px',
                  }}
                >
                  <p><strong>{qIndex + 1}. {q.question}</strong></p>
                  <p>Your answer: {q.options[answers[qIndex]]}</p>
                  <p>Correct answer: {q.options[q.correctAnswer]}</p>
                  {q.explanation && (
                    <p style={{ fontStyle: 'italic', color: '#4b5563', marginTop: '0.5rem' }}>
                      {q.explanation}
                    </p>
                  )}
                </div>
              ))}

              <button onClick={resetQuiz} className="btn btn-primary">
                Take Another Quiz
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '900px', marginTop: '2rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>🧠 Quizzes</h2>

      {error && <div className="error-message">{error}</div>}

      {showForm ? (
        <div className="card">
          <h3>Generate New Quiz</h3>
          <form onSubmit={handleGenerateQuiz}>
            <div className="form-group">
              <label htmlFor="title">Quiz Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter quiz title"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="topic">Topic (Optional)</label>
              <input
                type="text"
                id="topic"
                name="topic"
                value={formData.topic}
                onChange={handleChange}
                placeholder="e.g., Biology Chapter 3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="textOrManual">
                {textbookId
                  ? 'Textbook selected - quiz will be generated from uploaded textbook'
                  : 'Or paste text directly to generate quiz'}
              </label>
              {!textbookId && (
                <textarea
                  id="text"
                  name="text"
                  value={formData.text}
                  onChange={handleChange}
                  placeholder="Paste your study material here..."
                  rows="6"
                />
              )}
            </div>

            {!textbookId && (
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                Or <button
                  type="button"
                  onClick={() => navigate('/upload')}
                  className="btn btn-outline"
                  style={{ display: 'inline', padding: '4px 8px' }}
                >
                  upload a textbook first
                </button>
              </p>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || (!textbookId && !formData.text)}
              >
                {loading ? 'Generating...' : 'Generate Quiz'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
          style={{ marginBottom: '2rem' }}
        >
          + Create New Quiz
        </button>
      )}

      <div className="grid grid-2">
        {quizzes.map((quiz) => (
          <div key={quiz._id} className="card">
            <h3>{quiz.title}</h3>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              {quiz.questions.length} questions
              {quiz.topic && ` • ${quiz.topic}`}
              <br />
              Created: {new Date(quiz.createdAt).toLocaleDateString()}
            </p>
            <button
              onClick={() => startQuiz(quiz)}
              className="btn btn-primary"
            >
              Start Quiz
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Quizzes;
