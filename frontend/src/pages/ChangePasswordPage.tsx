import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

export const ChangePasswordPage: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [strengthLabel, setStrengthLabel] = useState('Weak')
  const [strengthClass, setStrengthClass] = useState('strength-weak')

  const navigate = useNavigate()

  useEffect(() => {
    if (!newPassword) {
      setStrengthLabel('Weak')
      setStrengthClass('strength-weak')
      return
    }

    let criteria = 0
    if (newPassword.length >= 8) criteria++
    if (/[A-Z]/.test(newPassword)) criteria++
    if (/[a-z]/.test(newPassword)) criteria++
    if (/[0-9]/.test(newPassword)) criteria++
    if (/[^A-Za-z0-9]/.test(newPassword)) criteria++

    if (criteria <= 2) {
      setStrengthLabel('Weak')
      setStrengthClass('strength-weak')
    } else if (criteria <= 4) {
      setStrengthLabel('Medium')
      setStrengthClass('strength-medium')
    } else {
      setStrengthLabel('Strong')
      setStrengthClass('strength-strong')
    }
  }, [newPassword])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    if (strengthLabel === 'Weak') {
      setError('Password is too weak. Please include at least 8 characters with a mix of uppercase, lowercase, numbers, or symbols.')
      return
    }

    setLoading(true)
    try {
      await api.auth.changePassword({ current_password: currentPassword, new_password: newPassword })
      setMessage('Password successfully changed. Redirecting to home...')
      setTimeout(() => navigate('/upload'), 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell page-shell-narrow">
      <div className="glass-card">
        <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Change Password</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          Update your account master password securely.
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              className="form-control"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter current password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              className="form-control"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter new password (min. 8 characters)"
            />
            {newPassword && (
              <div className={`password-strength-container ${strengthClass}`}>
                <div className="password-strength-bar">
                  <div className="password-strength-fill" />
                </div>
                <div className="password-strength-label">
                  Strength: <strong>{strengthLabel}</strong>
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              className="form-control"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Confirm new password"
            />
          </div>

          <button
            type="submit"
            className="btn-primary btn-full"
            disabled={loading || (newPassword.length > 0 && strengthLabel === 'Weak')}
            style={{ marginTop: '1rem' }}
          >
            {loading ? 'Updating Password...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
