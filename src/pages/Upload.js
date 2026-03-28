import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Upload = ({ user }) => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [textbooks, setTextbooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTextbooks();
  }, []);

  const fetchTextbooks = async () => {
    try {
      const response = await axios.get(`${API_URL}/textbooks`);
      setTextbooks(response.data);
    } catch (err) {
      console.error('Error fetching textbooks:', err);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    if (!title) {
      setTitle(e.target.files[0]?.name?.replace('.pdf', '') || '');
    }
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!file) {
      setError('Please select a file');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);

    try {
      await axios.post(`${API_URL}/textbooks/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess('Textbook uploaded successfully!');
      setFile(null);
      setTitle('');
      fetchTextbooks();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Error uploading textbook'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = (textbookId) => {
    navigate(`/quizzes?textbookId=${textbookId}`);
  };

  const handleGenerateFlashcards = (textbookId) => {
    navigate(`/flashcards?textbookId=${textbookId}`);
  };

  return (
    <div className="container" style={{ maxWidth: '900px', marginTop: '2rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>📚 Upload Textbook</h2>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="card">
        <h3>Upload New Textbook</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Textbook Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter textbook title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="file">PDF File</label>
            <div className="file-upload" onClick={() => document.getElementById('file').click()}>
              <input
                type="file"
                id="file"
                accept=".pdf"
                onChange={handleFileChange}
              />
              {file ? (
                <p style={{ fontWeight: 'bold', color: '#4f46e5' }}>{file.name}</p>
              ) : (
                <>
                  <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>📄</p>
                  <p>Click to upload a PDF file</p>
                  <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.5rem' }}>
                    Maximum file size: 10MB
                  </p>
                </>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !file}
          >
            {loading ? 'Uploading...' : 'Upload Textbook'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Your Textbooks</h3>
        {textbooks.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
            No textbooks uploaded yet. Upload your first one above!
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {textbooks.map((textbook) => (
              <div
                key={textbook._id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h4 style={{ marginBottom: '0.5rem' }}>{textbook.title}</h4>
                  <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                    {new Date(textbook.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleGenerateQuiz(textbook._id)}
                    className="btn btn-outline"
                    style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                  >
                    Generate Quiz
                  </button>
                  <button
                    onClick={() => handleGenerateFlashcards(textbook._id)}
                    className="btn btn-outline"
                    style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                  >
                    Generate Flashcards
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;
