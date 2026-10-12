import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setError('')
    setMessage('')
    setLoading(true)

    try {
      await api.auth.forgotPassword({ email: email.trim() })
      setMessage('If an account exists with this email, a password reset link has been sent.')
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset.')
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = email.trim().length > 0

  return (
    <div className="page-shell page-shell-narrow" style={{ padding: '1.5rem 1rem' }}>
      {/* Breadcrumb Trail (DBIM Section 4.5.ii) */}
      <nav aria-label="Breadcrumb" style={{ fontSize: '0.82rem', color: '#606060', marginBottom: '1rem' }}>
        <Link to="/" style={{ color: '#214AAB', textDecoration: 'none' }}>Home</Link>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <Link to="/login" style={{ color: '#214AAB', textDecoration: 'none' }}>Sign In</Link>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span style={{ color: '#150202', fontWeight: 600 }}>Forgot Password</span>
      </nav>

      <div className="glass-card" style={{ background: '#FFFFFF', border: '1px solid #EBEAEA', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#162F6A', textAlign: 'center', margin: '0 0 0.5rem' }}>
          Reset Password Request
        </h1>
        <p style={{ color: '#606060', fontSize: '0.88rem', textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Enter your registered government email address to receive password recovery instructions.
        </p>

        {/* Instructions at starting of form (DBIM Annexure B.i) */}
        <div style={{ background: '#F8FAFC', border: '1px solid #EBEAEA', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#606060', lineHeight: 1.5 }}>
          <strong>Instructions:</strong> Please provide your registered email address. Fields marked with an asterisk (*) are mandatory.
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="forgot-email" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#150202', marginBottom: '4px', display: 'block' }}>
              Registered Email Address <span style={{ color: '#DC3545' }}>*</span> <span style={{ fontSize: '0.75rem', color: '#606060' }}>(Required)</span>
            </label>
            <input
              type="email"
              id="forgot-email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="name@example.gov.in"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #C6C6C6' }}
            />
            <span className="field-help" style={{ color: '#606060', fontSize: '0.78rem', marginTop: '2px', display: 'block' }}>
              A secure password reset link will be dispatched to this address.
            </span>
          </div>

          <button
            type="submit"
            className="btn-primary btn-full"
            disabled={loading || !isFormValid}
            style={{
              marginTop: '1.5rem',
              backgroundColor: !isFormValid ? '#E2E8F0' : '#214AAB',
              color: !isFormValid ? '#64748B' : '#FFFFFF',
              border: !isFormValid ? '1px solid #CBD5E1' : '1px solid #214AAB',
              cursor: !isFormValid ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? 'Sending Request...' : 'Send Reset Link'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link to="/login" style={{ color: '#214AAB', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>
            &larr; Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
