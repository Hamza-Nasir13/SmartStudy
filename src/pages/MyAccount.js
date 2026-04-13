import React, { useState, useEffect } from 'react';
import API from '../api';

const MyAccount = ({ user }) => {
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    plan: 'free',
    isPaid: false,
    createdAt: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updateName, setUpdateName] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await API.get('/user/me');
      setProfileData({
        name: response.data.user.name,
        email: response.data.user.email,
        plan: response.data.user.plan,
        isPaid: response.data.user.isPaid,
        createdAt: response.data.user.createdAt
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to load profile'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!updateName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const response = await API.put('/user/update-profile', { name: updateName });
      setProfileData(prev => ({ ...prev, name: response.data.user.name }));
      setSuccess('Profile updated successfully');
      setUpdateName(response.data.user.name);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          'Failed to update profile'
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      await API.delete('/user/delete-account');
      // Clear local storage and redirect would be handled by parent component
      // For now, we'll show success message
      setSuccess('Account deleted successfully');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to delete account'
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div className="spinner-border" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <div className="card" style={{ padding: '2rem', lineHeight: '1.7' }}>
        <h2 className="mb-4" style={{ textAlign: 'center' }}>My Account</h2>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="profile-section mb-4 style={{ marginBottom: '2rem' }}">
          <div className="profile-info">
            <h3>Profile Information</h3>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p style={{ marginBottom: '0.9rem' }}><strong>Name:</strong> {profileData.name}</p>
                <p style={{ marginBottom: '0.9rem' }}><strong>Email:</strong> {profileData.email}</p>
              </div>
              
            </div>
            <p style={{ marginBottom: '0.9rem' }}><strong>Account Created:</strong> {new Date(profileData.createdAt).toLocaleDateString()}</p>
            <p style={{ marginBottom: '0.9rem' }}><strong>Account Status:</strong>
              <span className={`badge ${profileData.isPaid ? 'bg-success' : 'bg-secondary'}`}>
                {profileData.isPaid ? 'Paid' : 'Free'}
              </span>
            </p>
          </div>
        </div>

        

        <div className="section mb-4 style={{ marginBottom: '2rem' }}">
          <div className="d-grid gap-2">
            <a href="/pricing">
              <button className="btn btn-primary btn-sm">
                Upgrade Plan
              </button>
            </a>
          </div>
        </div>

        <div className="section">
          <h3>Account Actions</h3>
          <div className="d-grid gap-2">
            <button
              className="btn btn-outline btn-danger btn-sm"
              onClick={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAccount;