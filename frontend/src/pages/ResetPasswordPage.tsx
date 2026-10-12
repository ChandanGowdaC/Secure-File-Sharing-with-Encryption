import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const [strengthLabel, setStrengthLabel] = useState('Weak');
  const [strengthClass, setStrengthClass] = useState('strength-weak');

  useEffect(() => {
    if (!newPassword) {
      setStrengthLabel('Weak');
      setStrengthClass('strength-weak');
      return;
    }
    
    let criteria = 0;
    if (newPassword.length >= 8) criteria++;
    if (/[A-Z]/.test(newPassword)) criteria++;
    if (/[a-z]/.test(newPassword)) criteria++;
    if (/[0-9]/.test(newPassword)) criteria++;
    if (/[^A-Za-z0-9]/.test(newPassword)) criteria++;

    if (criteria <= 2) {
      setStrengthLabel('Weak');
      setStrengthClass('strength-weak');
    } else if (criteria <= 4) {
      setStrengthLabel('Medium');
      setStrengthClass('strength-medium');
    } else {
      setStrengthLabel('Strong');
      setStrengthClass('strength-strong');
    }
  }, [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (strengthLabel === 'Weak') {
      setError('Password is too weak. Please use a stronger password.');
      return;
    }

    setLoading(true);

    try {
      await api.auth.resetPassword({ token, new_password: newPassword });
      setMessage('Password successfully reset. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="page-shell page-shell-narrow">
        <div className="glass-card text-center">
          <h2>Invalid Reset Link</h2>
          <p className="field-help" style={{ marginTop: '1rem' }}>The password reset link is invalid or missing a token.</p>
          <div style={{ marginTop: '1.5rem' }}>
            <Link to="/login" className="btn-primary">Back to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell page-shell-narrow">
      <div className="glass-card">
        <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Reset Password</h1>
        
        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              className="form-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter new password"
            />
            {newPassword && (
              <div className={`password-strength-container ${strengthClass}`}>
                <div className="password-strength-bar">
                  <div className="password-strength-fill"></div>
                </div>
                <div className="password-strength-label">{strengthLabel}</div>
              </div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Confirm new password"
            />
          </div>
          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
