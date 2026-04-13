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
      const response = await API.get('/api/user/profile');
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
      const response = await API.put('/api/user/update-profile', { name: updateName });
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
      await API.delete('/api/user/delete-account');
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
      <div className="card">
        <h2 className="mb-4" style={{ textAlign: 'center' }}>My Account</h2>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="profile-section">
          <div className="profile-info">
            <h3>Profile Information</h3>
            <p><strong>Name:</strong> {profileData.name}</p>
            <p><strong>Email:</strong> {profileData.email}</p>
            <p><strong>Account Created:</strong> {new Date(profileData.createdAt).toLocaleDateString()}</p>
            <p><strong>Account Status:</strong>
              <span className={`badge ${profileData.isPaid ? 'bg-success' : 'bg-secondary'}`}>
                {profileData.isPaid ? 'Paid' : 'Free'}
              </span>
            </p>
          </div>
        </div>

        <div className="section mb-4">
          <h3>Edit Profile</h3>
          <form onSubmit={handleUpdateName}>
            <div className="mb-3">
              <label htmlFor="updateName" className="form-label">New Name</label>
              <input
                type="text"
                className="form-control"
                id="updateName"
                value={updateName}
                onChange={(e) => setUpdateName(e.target.value)}
                required
                disabled={updating}
              />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={updating}>
              {updating ? 'Updating...' : 'Update Name'}
            </button>
          </form>
        </div>

        <div className="section mb-4">
          <h3>Subscription</h3>
          <div className="subscription-info">
            <p><strong>Current Plan:</strong>
              <span className={`badge ${profileData.plan === 'premium' ? 'bg-success' : 'bg-info'}`}>
                {profileData.plan === 'premium' ? 'Premium' : 'Free'}
              </span>
            </p>
            <p>{profileData.plan === 'free' ?
              'Limited to 3 textbook uploads and 50 flashcards per month' :
              'Unlimited textbook uploads and flashcard generation'}
            </p>
          </div>

          <div className="d-grid gap-2">
            {profileData.plan === 'free' && (
              <>
                <button className="btn btn-outline btn-primary" style={{ marginBottom: '8px' }}>
                  Upgrade to Premium Monthly ($9.99/month)
                </button>
                <button className="btn btn-outline btn-primary" style={{ marginBottom: '8px' }}>
                  Upgrade to Premium Annual ($99.99/year)
                </button>
                <button className="btn btn-link">
                  View All Plans
                </button>
              </>
            )}
            {profileData.plan === 'premium' && (
              <>
                <button className="btn btn-outline btn-success">
                  Manage Subscription
                </button>
                <button className="btn btn-link">
                  View Plans
                </button>
              </>
            )}
          </div>
        </div>

        <div className="section">
          <h3>Account Actions</h3>
          <div className="d-grid gap-2">
            <button
              className="btn btn-outline btn-danger"
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