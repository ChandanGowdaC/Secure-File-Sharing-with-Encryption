import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
      setError('New passwords do not match. Please verify both entries.')
      return
    }

    if (strengthLabel === 'Weak') {
      setError('Password is too weak. Please include at least 8 characters with a mix of uppercase, lowercase, numbers, or symbols.')
      return
    }

    setLoading(true)
    try {
      await api.auth.changePassword({ current_password: currentPassword, new_password: newPassword })
      setMessage('Password successfully changed! Redirecting...')
      setTimeout(() => navigate('/upload'), 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to change password.')
    } finally {
      setLoading(false)
    }
  }

  const isFormValid =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    confirmPassword.length >= 8 &&
    newPassword === confirmPassword

  return (
    <div className="page-shell page-shell-narrow" style={{ padding: '1.5rem 1rem' }}>
      {/* Breadcrumb Trail (DBIM Section 4.5.ii) */}
      <nav aria-label="Breadcrumb" style={{ fontSize: '0.82rem', color: '#606060', marginBottom: '1rem' }}>
        <Link to="/" style={{ color: '#214AAB', textDecoration: 'none' }}>Home</Link>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span style={{ color: '#150202', fontWeight: 600 }}>Change Password</span>
      </nav>

      <div className="glass-card" style={{ background: '#FFFFFF', border: '1px solid #EBEAEA', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#162F6A', textAlign: 'center', margin: '0 0 0.5rem' }}>
          Change Account Password
        </h1>
        <p style={{ color: '#606060', fontSize: '0.88rem', textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Update your account master password securely.
        </p>

        {/* Instructions at starting of form (DBIM Annexure B.i) */}
        <div style={{ background: '#F8FAFC', border: '1px solid #EBEAEA', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#606060', lineHeight: 1.5 }}>
          <strong>Instructions:</strong> Fields marked with an asterisk (*) are mandatory. The new password must contain at least 8 characters.
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="currentPassword" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#150202', marginBottom: '4px', display: 'block' }}>
              Current Password <span style={{ color: '#DC3545' }}>*</span> <span style={{ fontSize: '0.75rem', color: '#606060' }}>(Required)</span>
            </label>
            <input
              type="password"
              id="currentPassword"
              className="form-control"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter current password"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #C6C6C6' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="newPassword" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#150202', marginBottom: '4px', display: 'block' }}>
              New Password <span style={{ color: '#DC3545' }}>*</span> <span style={{ fontSize: '0.75rem', color: '#606060' }}>(Required)</span>
            </label>
            <input
              type="password"
              id="newPassword"
              className="form-control"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter new password (min. 8 characters)"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #C6C6C6' }}
            />
            {newPassword && (
              <div className={`password-strength-container ${strengthClass}`} style={{ marginTop: '4px' }}>
                <div className="password-strength-bar">
                  <div className="password-strength-fill" />
                </div>
                <div className="password-strength-label" style={{ fontSize: '0.78rem' }}>
                  Strength: <strong>{strengthLabel}</strong>
                </div>
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="confirmPassword" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#150202', marginBottom: '4px', display: 'block' }}>
              Confirm New Password <span style={{ color: '#DC3545' }}>*</span> <span style={{ fontSize: '0.75rem', color: '#606060' }}>(Required)</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="form-control"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Confirm new password"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #C6C6C6' }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary btn-full"
            disabled={loading || !isFormValid}
            style={{
              marginTop: '0.5rem',
              backgroundColor: !isFormValid ? '#E2E8F0' : '#214AAB',
              color: !isFormValid ? '#64748B' : '#FFFFFF',
              border: !isFormValid ? '1px solid #CBD5E1' : '1px solid #214AAB',
              cursor: !isFormValid ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? 'Updating Password...' : 'Save Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
