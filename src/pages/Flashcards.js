import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api';

const Flashcards = ({ user }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const textbookId = searchParams.get('textbookId');

  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(!!textbookId);
  const [formData, setFormData] = useState({
    textbookId: textbookId || '',
    front: '',
    back: '',
    category: '',
    count: 10,
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [selectedFlashcards, setSelectedFlashcards] = useState([]); // Array of IDs
  const [selectAll, setSelectAll] = useState(false);
  const [usage, setUsage] = useState({ uploads_used: 0, flashcards_generated: 0 });

  useEffect(() => {
    fetchFlashcards();
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await axios.get(`${API_URL}/textbooks/usage`);
      setUsage(response.data.usage);
    } catch (err) {
      console.error('Error fetching usage:', err);
    }
  };

  // Sync textbookId from URL with formData
  useEffect(() => {
    if (textbookId) {
      setFormData(prev => ({ ...prev, textbookId }));
    }
  }, [textbookId]);

  const fetchFlashcards = async () => {
    try {
      const response = await axios.get(`${API_URL}/flashcards`);
      setFlashcards(response.data);
    } catch (err) {
      console.error('Error fetching flashcards:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleCreateFlashcard = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('Creating flashcard with data:', formData);

    try {
      const response = await axios.post(`${API_URL}/flashcards/create`, formData);
      console.log('Flashcard creation successful:', response.data);
      setSuccess('Flashcard created successfully!');
      setFormData({ ...formData, front: '', back: '', category: '' });
      fetchFlashcards();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error creating flashcard';
      console.error('Flashcard creation failed:', {
        error: err.message,
        response: err.response?.data,
        formData: formData
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    const requestData = {
      textbookId: formData.textbookId,
      count: parseInt(formData.count),
    };

    console.log('Generating flashcards with data:', requestData);

    try {
      const response = await axios.post(`${API_URL}/flashcards/generate`, requestData);
      console.log('Flashcard generation successful:', response.data);
      setSuccess(response.data.message);
      setShowForm(false);
      fetchFlashcards();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error generating flashcards';
      console.error('Flashcard generation failed:', {
        error: err.message,
        response: err.response?.data,
        request: requestData
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const startStudy = (cards) => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setStudyMode(true);
  };

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const exitStudy = () => {
    setStudyMode(false);
    setIsFlipped(false);
  };

  const toggleSelectFlashcard = (id) => {
    setSelectedFlashcards(prev =>
      prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedFlashcards.length === flashcards.length) {
      setSelectedFlashcards([]);
      setSelectAll(false);
    } else {
      const allIds = flashcards.map(fc => fc._id);
      setSelectedFlashcards(allIds);
      setSelectAll(true);
    }
  };

  const deleteSelectedFlashcards = async () => {
    if (selectedFlashcards.length === 0) {
      setError('No flashcards selected for deletion');
      return;
    }

    if (!window.confirm(`Delete ${selectedFlashcards.length} selected flashcard(s)? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Delete each selected flashcard individually
      const results = [];
      for (const id of selectedFlashcards) {
        try {
          await axios.delete(`${API_URL}/flashcards/${id}`);
          results.push({ id, success: true });
        } catch (err) {
          console.error(`Failed to delete flashcard ${id}:`, err);
          results.push({
            id,
            success: false,
            error: err.response?.data?.message || err.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        setSuccess(`Successfully deleted ${successCount} flashcard(s)`);
      }
      if (failCount > 0) {
        setError(`${failCount} flashcard(s) could not be deleted`);
      }

      setSelectedFlashcards([]);
      setSelectAll(false);
      await fetchFlashcards();
    } catch (err) {
      console.error('Bulk delete error:', err);
      setError('An unexpected error occurred during deletion');
    } finally {
      setLoading(false);
    }
  };

  const deleteFlashcard = async (id) => {
    if (window.confirm('Are you sure you want to delete this flashcard?')) {
      try {
        await axios.delete(`${API_URL}/flashcards/${id}`);
        fetchFlashcards();
      } catch (err) {
        console.error('Error deleting flashcard:', {
          error: err.message,
          response: err.response?.data,
          id
        });
        setError(err.response?.data?.message || 'Error deleting flashcard');
      }
    }
  };

  if (studyMode && flashcards.length > 0) {
    const currentCard = flashcards[currentIndex];

    return (
      <div className="container" style={{ maxWidth: '800px', marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <button onClick={exitStudy} className="btn btn-outline">
            ← Exit Study Mode
          </button>
          <p style={{ fontWeight: 'bold' }}>
            {currentIndex + 1} / {flashcards.length}
          </p>
        </div>

        <div
          className={`flashcard ${isFlipped ? 'flipped' : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className="flashcard-inner">
            <div className="flashcard-front">
              <p>{currentCard.front}</p>
            </div>
            <div className="flashcard-back">
              <p>{currentCard.back}</p>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
            Click the card to flip
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button
              onClick={prevCard}
              className="btn btn-secondary"
              disabled={currentIndex === 0}
            >
              Previous
            </button>
            <button
              onClick={nextCard}
              className="btn btn-secondary"
              disabled={currentIndex === flashcards.length - 1}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '900px', marginTop: '2rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>🎴 Flashcards</h2>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Usage Indicator */}
      <div style={{
        backgroundColor: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '600', color: '#1e40af' }}>Flashcards Used:</span>
          <span style={{
            fontWeight: 'bold',
            fontSize: '1.1rem',
            color: usage.flashcards_generated >= 50 ? '#dc2626' : usage.flashcards_generated >= 40 ? '#d97706' : '#059669'
          }}>
            {usage.flashcards_generated} / 50
          </span>
        </div>
        {usage.flashcards_generated >= 40 && usage.flashcards_generated < 50 && (
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#d97706' }}>
            ⚠️ You're close to your limit! Only {50 - usage.flashcards_generated} flashcards remaining.
          </p>
        )}
        {usage.flashcards_generated >= 50 && (
          <>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#dc2626' }}>
              ❌ Flashcard limit reached. You've generated all 50 flashcards.
            </p>
            <button
              onClick={() => window.location.href = '/pricing'}
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Upgrade to Premium
            </button>
          </>
        )}
      </div>

      {showForm ? (
        <div className="card">
          <h3>
            {textbookId ? 'Generate Flashcards from Textbook' : 'Create Flashcard'}
          </h3>

          {textbookId ? (
            <div>
              <div className="form-group">
                <label htmlFor="count">Number of Flashcards</label>
                <input
                  type="number"
                  id="count"
                  name="count"
                  value={formData.count}
                  onChange={handleChange}
                  min="1"
                  max="20"
                />
              </div>
              <button
                onClick={handleGenerateFlashcards}
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate Flashcards'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="btn btn-secondary"
                style={{ marginLeft: '1rem' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateFlashcard}>
              <div className="form-group">
                <label htmlFor="front">Front (Term/Question)</label>
                <textarea
                  id="front"
                  name="front"
                  value={formData.front}
                  onChange={handleChange}
                  placeholder="Enter the term or question"
                  rows="2"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="back">Back (Definition/Answer)</label>
                <textarea
                  id="back"
                  name="back"
                  value={formData.back}
                  onChange={handleChange}
                  placeholder="Enter the definition or answer"
                  rows="4"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category (Optional)</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="e.g., Biology, History, Math"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Flashcard'}
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
          )}
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
          style={{ marginBottom: '2rem' }}
        >
          {textbookId ? '+ Generate from Textbook' : '+ Create Flashcard'}
        </button>
      )}

      {!studyMode && flashcards.length > 0 && (
        <button
          onClick={() => startStudy(flashcards)}
          className="btn btn-primary"
          style={{ marginBottom: '2rem' }}
        >
          📖 Start Study Session ({flashcards.length} cards)
        </button>
      )}

      {/* Bulk actions toolbar */}
      {!studyMode && flashcards.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          padding: '1rem',
          background: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={selectAll}
              onChange={toggleSelectAll}
              style={{ width: '18px', height: '18px' }}
            />
            <label style={{ cursor: 'pointer' }}>Select All</label>
            <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              ({selectedFlashcards.length} of {flashcards.length} selected)
            </span>
          </div>
          {selectedFlashcards.length > 0 && (
            <button
              onClick={deleteSelectedFlashcards}
              className="btn"
              style={{
                background: '#dc2626',
                color: 'white',
                padding: '8px 16px',
                fontSize: '0.9rem'
              }}
            >
              Delete Selected ({selectedFlashcards.length})
            </button>
          )}
        </div>
      )}

      {!studyMode && (
        <div className="grid grid-2">
          {flashcards.map((card, index) => (
            <div key={card._id} className="card" style={{ position: 'relative' }}>
              {/* Checkbox in top-right corner */}
              <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={selectedFlashcards.includes(card._id)}
                  onChange={() => toggleSelectFlashcard(card._id)}
                  style={{ width: '18px', height: '18px' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <span
                  style={{
                    background: '#eef2ff',
                    color: '#4f46e5',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                  }}
                >
                  {card.category || 'Uncategorized'}
                </span>
              </div>
              <h4 style={{ marginBottom: '0.5rem' }}>Front:</h4>
              <p style={{ marginBottom: '1rem', fontWeight: '500' }}>
                {card.front.substring(0, 100)}
                {card.front.length > 100 && '...'}
              </p>
              <h4 style={{ marginBottom: '0.5rem' }}>Back:</h4>
              <p style={{ marginBottom: '1rem' }}>
                {card.back.substring(0, 100)}
                {card.back.length > 100 && '...'}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setCurrentIndex(index);
                    startStudy([card]);
                  }}
                  className="btn btn-outline"
                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                >
                  Study
                </button>
                <button
                  onClick={() => deleteFlashcard(card._id)}
                  className="btn btn-outline"
                  style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#dc2626', borderColor: '#dc2626' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {flashcards.length === 0 && !showForm && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎴</p>
          <h3>No flashcards yet</h3>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
            Create your first flashcard or generate them from a textbook.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            Create Flashcard
          </button>
        </div>
      )}
    </div>
  );
};

export default Flashcards;
