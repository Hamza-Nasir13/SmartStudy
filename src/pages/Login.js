import React, { useState } from 'react';
import API from '../api';

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    token: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let endpoint;
      if (isPasswordReset) {
        endpoint = '/auth/forgot-password';
      } else if (isResetPassword) {
        endpoint = `/auth/reset-password/${formData.token}`;
      } else {
        endpoint = isLogin ? '/auth/login' : '/auth/register';
      }
      const response = await API.post(endpoint, formData);

      if (!isPasswordReset && !isResetPassword) {
        onLogin(response.data.user, response.data.token);
      } else if (isPasswordReset) {
        setResetSuccess('If your email is registered, you will receive a password reset link');
        setFormData({ email: '' });
      } else if (isResetPassword) {
        setResetSuccess('Password has been reset successfully');
        setFormData({ token: '', newPassword: '', confirmPassword: '' });
        setIsLogin(true);
        setIsPasswordReset(false);
        setIsResetPassword(false);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          'An error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '480px', marginTop: '3rem' }}>
      <div className="card">
        <h2 className="mb-4" style={{ textAlign: 'center' }}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {(!isLogin && !isPasswordReset && !isResetPassword) && (
            <div className="form-group mb-4">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </div>
          )}

          {(!isPasswordReset && !isResetPassword) && (
            <div className="form-group mb-4">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
          )}

          {(!isPasswordReset && !isResetPassword) && (
            <div className="form-group mb-4">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
                autoComplete="current-password"
              />
            </div>
          )}

          {isPasswordReset && (
            <div className="form-group mb-4">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                placeholder="Enter your email to receive reset link"
              />
            </div>
          )}

          {isResetPassword && (
            <>
              <div className="form-group mb-4">
                <label htmlFor="token">Reset Token</label>
                <input
                  type="text"
                  id="token"
                  name="token"
                  value={formData.token}
                  onChange={handleChange}
                  required
                  placeholder="Enter the reset token from your email"
                />
              </div>
              <div className="form-group mb-4">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  minLength="6"
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group mb-4">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength="6"
                  autoComplete="new-password"
                />
              </div>
            </>
          )}

          {resetSuccess && (
            <div className="success-message mb-4" style={{ textAlign: 'center', color: '#28a745' }}>
              {resetSuccess}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? 'Please wait...' :
              isLogin ? 'Login' :
                !isLogin && !isPasswordReset && !isResetPassword ? 'Create Account' :
                  isPasswordReset ? 'Send Reset Link' :
                    'Reset Password'}
          </button>
        </form>

        <div className="text-center mt-4">
          {isLogin ? (
            <>
              {!isPasswordReset && !isResetPassword && (
                <>
                  <span>Don't have an account? </span>
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError('');
                      setFormData({ name: '', email: '', password: '' });
                    }}
                    className="btn btn-outline"
                  >
                    Sign Up
                  </button>
                  <br />
                  <button
                    onClick={() => {
                      setIsPasswordReset(true);
                      setIsLogin(false);
                      setError('');
                      setFormData({ email: '' });
                    }}
                    className="btn btn-outline"
                    style={{ marginTop: '8px' }}
                  >
                    Forgot Password?
                  </button>
                </>
              )}
            </>
          ) : !isLogin && !isPasswordReset && !isResetPassword ? (
            <>
              <span>Already have an account? </span>
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setFormData({ name: '', email: '', password: '' });
                }}
                className="btn btn-outline"
              >
                Login
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setIsLogin(true);
                  setIsPasswordReset(false);
                  setIsResetPassword(false);
                  setError('');
                  setFormData({ name: '', email: '', password: '' });
                }}
                className="btn btn-outline"
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
