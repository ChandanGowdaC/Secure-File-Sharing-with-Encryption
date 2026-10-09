import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { generateLongTermKeyPair } from '../../../crypto/src/keypair'
import { storePrivateKey } from '../../../crypto/src/keystore'

interface RegisterPageProps {
  onRegisterSuccess?: (username: string) => void
}

export const RegisterPage: React.FC<RegisterPageProps> = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [strengthLabel, setStrengthLabel] = useState('Weak');
  const [strengthClass, setStrengthClass] = useState('strength-weak');

  useEffect(() => {
    if (!password) {
      setStrengthLabel('Weak');
      setStrengthClass('strength-weak');
      return;
    }
    
    let criteria = 0;
    if (password.length >= 8) criteria++;
    if (/[A-Z]/.test(password)) criteria++;
    if (/[a-z]/.test(password)) criteria++;
    if (/[0-9]/.test(password)) criteria++;
    if (/[^A-Za-z0-9]/.test(password)) criteria++;

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
  }, [password]);

  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify and try again.')
      return
    }

    if (strengthLabel === 'Weak') {
      setError('Password is too weak. Please use a stronger password.')
      return
    }

    setLoading(true)

    try {
      // 1. Generate client-side ECDH P-256 long-term keypair
      const keypair = await generateLongTermKeyPair()

      // 2. Store private key safely in browser IndexedDB (never sent to server)
      await storePrivateKey(username, keypair.privateKey)

      // 3. Register with FastAPI backend (keypair.publicKey is already a JWK JSON string)
      await api.auth.register({
        username,
        email,
        password,
        long_term_public_key: keypair.publicKey,
      })

      setSuccessMsg('Account and cryptographic keys created successfully! Redirecting to sign in...')
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const [resettingDb, setResettingDb] = useState(false)

  const handleQuickWipe = async () => {
    const ok = window.confirm(
      "⚠️ Wipe all database tables and start fresh?\n\nThis will clear all registered accounts and transfers so you can register with any username immediately."
    )
    if (!ok) return
    setResettingDb(true)
    try {
      await api.admin.emergencyReset()
      setError(null)
      setSuccessMsg("Database wiped cleanly! All tables are fresh. You can now register.")
    } catch (err: any) {
      setError(err.message || "Failed to wipe database.")
    } finally {
      setResettingDb(false)
    }
  }

  return (
    <div className="page-shell page-shell-narrow">
      <div className="glass-card">
        <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Create Account</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          Generates zero-knowledge ECDH keys stored locally in your browser.
        </p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <div>{error}</div>
            {(error.toLowerCase().includes('already') ||
              error.toLowerCase().includes('taken') ||
              error.toLowerCase().includes('registered') ||
              error.toLowerCase().includes('admin')) && (
              <div
                style={{
                  marginTop: '0.65rem',
                  paddingTop: '0.6rem',
                  borderTop: '1px solid rgba(239, 68, 68, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <span style={{ fontSize: '0.82rem', color: '#991b1b' }}>Need to start fresh with a clean database?</span>
                <button
                  type="button"
                  className="btn-danger"
                  style={{
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.78rem',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                  onClick={handleQuickWipe}
                  disabled={resettingDb}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  {resettingDb ? 'Wiping...' : 'Wipe All Tables & Reset DB'}
                </button>
              </div>
            )}
          </div>
        )}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g. alice"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              required
              className="form-control"
              placeholder="alice@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>
              Two-factor authentication (2FA) verification codes will be sent here upon login.
            </small>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                className="form-control"
                placeholder="At least 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', paddingRight: '45px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {password && (
              <div className={`password-strength-container ${strengthClass}`}>
                <div className="password-strength-bar">
                  <div className="password-strength-fill"></div>
                </div>
                <div className="password-strength-label">{strengthLabel}</div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={8}
                className="form-control"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ width: '100%', paddingRight: '45px' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                }}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <small style={{ color: 'var(--danger-color)', fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>
                Passwords do not match
              </small>
            )}
            {confirmPassword && password === confirmPassword && (
              <small style={{ color: 'var(--success-color)', fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>
                Passwords match
              </small>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary btn-full" style={{ marginTop: '1rem' }}>
            {loading ? 'Generating ECDH Keypair...' : 'Register & Generate Cryptographic Identity'}
          </button>
        </form>
      </div>
    </div>
  )
}
