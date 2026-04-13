import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import Home from './pages/Home';
import Login from './pages/Login';
import Upload from './pages/Upload';
import Quizzes from './pages/Quizzes';
import Flashcards from './pages/Flashcards';
import Pricing from './pages/Pricing';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = (userData, authToken) => {
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const isAuthenticated = !!token;

  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-brand">
            📚 SmartStudy
          </Link>
          {isAuthenticated ? (
            <>
              <ul className="nav-links">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/upload">Upload Textbook</Link></li>
                <li><Link to="/quizzes">Quizzes</Link></li>
                <li><Link to="/flashcards">Flashcards</Link></li>
                <li><Link to="/pricing">Pricing</Link></li>
                <li><button onClick={logout} className="btn btn-outline" style={{ padding: '8px 16px' }}>Logout</button></li>
              </ul>
            </>
          ) : (
            <ul className="nav-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/pricing">Pricing</Link></li>
              <li><Link to="/login">Login</Link></li>
            </ul>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home user={user} isAuthenticated={isAuthenticated} />} />
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" /> : <Login onLogin={login} />
          }
        />
        <Route
          path="/upload"
          element={
            isAuthenticated ? <Upload user={user} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/quizzes"
          element={
            isAuthenticated ? <Quizzes user={user} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/flashcards"
          element={
            isAuthenticated ? <Flashcards user={user} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/pricing"
          element={
            isAuthenticated ? <Pricing user={user} /> : <Navigate to="/login" />
          }
        />
      </Routes>
    </div>
  );
};

export default App;
