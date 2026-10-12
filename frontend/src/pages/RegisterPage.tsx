import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api/client'
import { generateLongTermKeyPair } from '../crypto/keypair'
import { storePrivateKey } from '../crypto/keystore'

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
  const [resettingDb, setResettingDb] = useState(false)

  const [strengthLabel, setStrengthLabel] = useState('Weak')
  const [strengthClass, setStrengthClass] = useState('strength-weak')

  useEffect(() => {
    if (!password) {
      setStrengthLabel('Weak')
      setStrengthClass('strength-weak')
      return
    }

    let criteria = 0
    if (password.length >= 8) criteria++
    if (/[A-Z]/.test(password)) criteria++
    if (/[a-z]/.test(password)) criteria++
    if (/[0-9]/.test(password)) criteria++
    if (/[^A-Za-z0-9]/.test(password)) criteria++

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
  }, [password])

  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both password entries.')
      return
    }

    if (strengthLabel === 'Weak') {
      setError('Password is too weak. Please include at least 8 characters with a mix of uppercase, lowercase, numbers, or symbols.')
      return
    }

    if (username.trim().toLowerCase() === 'admin' || email.trim().toLowerCase() === 'admin@example.com') {
      setError("The 'admin' username is reserved for the System Administrator (password: admin123456). Please sign in on the Login page.")
      return
    }

    setLoading(true)

    try {
      // 1. Generate client-side ECDH P-256 long-term keypair
      const keypair = await generateLongTermKeyPair()

      // 2. Store private key safely in browser IndexedDB (never sent to server)
      await storePrivateKey(username, keypair.privateKey)

      // 3. Register with backend
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

  const handleQuickWipe = async () => {
    const ok = window.confirm(
      '⚠️ Wipe all database tables and start fresh?\n\nThis will clear all registered accounts and transfers so you can register with any username immediately.'
    )
    if (!ok) return
    setResettingDb(true)
    setError(null)
    try {
      const res = await api.admin.emergencyReset(username.trim())
      setError(null)
      setSuccessMsg(res.message || 'Database reset successfully! You may now register.')
    } catch (err: any) {
      setError(err.message || 'Failed to reset database.')
    } finally {
      setResettingDb(false)
    }
  }

  const isFormValid =
    username.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    confirmPassword.length >= 8 &&
    password === confirmPassword

  return (
    <div className="page-shell page-shell-narrow" style={{ padding: '1.5rem 1rem' }}>
      {/* Breadcrumb Trail (DBIM Section 4.5.ii) */}
      <nav aria-label="Breadcrumb" style={{ fontSize: '0.82rem', color: '#606060', marginBottom: '1rem' }}>
        <Link to="/" style={{ color: '#214AAB', textDecoration: 'none' }}>Home</Link>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span style={{ color: '#150202', fontWeight: 600 }}>Register</span>
      </nav>

      <div className="glass-card" style={{ background: '#FFFFFF', border: '1px solid #EBEAEA', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#162F6A', textAlign: 'center', margin: '0 0 0.5rem' }}>
          Create Citizen Account
        </h1>
        <p style={{ color: '#606060', fontSize: '0.88rem', textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Generates zero-knowledge ECDH keys stored locally in your browser IndexedDB hardware vault.
        </p>

        {/* Instructions at starting of form (DBIM Annexure B.i, Page 109/129) */}
        <div style={{ background: '#F8FAFC', border: '1px solid #EBEAEA', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#606060', lineHeight: 1.5 }}>
          <strong>Instructions:</strong> All fields marked with an asterisk (*) are mandatory. Your browser will automatically generate an ECDH P-256 cryptographic key pair upon submission.
        </div>

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
                  borderTop: '1px solid rgba(220, 53, 69, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <span style={{ fontSize: '0.82rem', color: '#842029' }}>Need to start fresh with a clean test database?</span>
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
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #DC3545',
                  }}
                  onClick={handleQuickWipe}
                  disabled={resettingDb}
                >
                  {resettingDb ? 'Wiping...' : 'Reset Database'}
                </button>
              </div>
            )}
          </div>
        )}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        {/* Registration Form (Annexure B - Single vertical column layout, Figure 81) */}
        <form onSubmit={handleSubmit}>
          {/* Field 1: Username */}
          <div className="form-group">
            <label htmlFor="reg-username" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#150202', marginBottom: '4px' }}>
              Username <span style={{ color: '#DC3545' }}>*</span> <span style={{ fontSize: '0.75rem', color: '#606060' }}>(Required)</span>
            </label>
            <input
              id="reg-username"
              type="text"
              required
              className="form-control"
              placeholder="e.g. rahul_sharma"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #C6C6C6' }}
            />
            <span className="field-help" style={{ color: '#606060', fontSize: '0.78rem', marginTop: '2px' }}>
              Unique alphanumeric portal username.
            </span>
          </div>

          {/* Field 2: Email */}
          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label htmlFor="reg-email" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#150202', marginBottom: '4px' }}>
              Email Address <span style={{ color: '#DC3545' }}>*</span> <span style={{ fontSize: '0.75rem', color: '#606060' }}>(Required)</span>
            </label>
            <input
              id="reg-email"
              type="email"
              required
              className="form-control"
              placeholder="name@example.gov.in"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #C6C6C6' }}
            />
            <span className="field-help" style={{ color: '#606060', fontSize: '0.78rem', marginTop: '2px' }}>
              Two-factor authentication (2FA) verification codes will be sent to this email upon login.
            </span>
          </div>

          {/* Field 3: Password */}
          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label htmlFor="reg-password" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#150202', marginBottom: '4px' }}>
              Password <span style={{ color: '#DC3545' }}>*</span> <span style={{ fontSize: '0.75rem', color: '#606060' }}>(Required)</span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                className="form-control"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', paddingRight: '45px', backgroundColor: '#FFFFFF', border: '1px solid #C6C6C6' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#606060',
                  padding: '4px',
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {password && (
              <div className={`password-strength-container ${strengthClass}`} style={{ marginTop: '4px' }}>
                <div className="password-strength-bar">
                  <div className="password-strength-fill"></div>
                </div>
                <div className="password-strength-label" style={{ fontSize: '0.78rem' }}>Strength: {strengthLabel}</div>
              </div>
            )}
            <span className="field-help" style={{ color: '#606060', fontSize: '0.78rem', marginTop: '2px' }}>
              Must contain at least 8 characters with upper, lower, numbers, or symbols.
            </span>
          </div>

          {/* Field 4: Confirm Password */}
          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label htmlFor="reg-confirm-password" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#150202', marginBottom: '4px' }}>
              Confirm Password <span style={{ color: '#DC3545' }}>*</span> <span style={{ fontSize: '0.75rem', color: '#606060' }}>(Required)</span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="reg-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={8}
                className="form-control"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ width: '100%', paddingRight: '45px', backgroundColor: '#FFFFFF', border: '1px solid #C6C6C6' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#606060',
                  padding: '4px',
                }}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <span style={{ color: '#DC3545', fontSize: '0.78rem', display: 'block', marginTop: '2px' }}>
                Passwords do not match.
              </span>
            )}
            {confirmPassword && password === confirmPassword && (
              <span style={{ color: '#198754', fontSize: '0.78rem', display: 'block', marginTop: '2px' }}>
                ✓ Passwords match.
              </span>
            )}
          </div>

          {/* Primary Action Button - disabled until valid (Annexure B.xiv) */}
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="btn-primary btn-full"
            style={{
              marginTop: '1.5rem',
              backgroundColor: !isFormValid ? '#E2E8F0' : '#214AAB',
              color: !isFormValid ? '#64748B' : '#FFFFFF',
              border: !isFormValid ? '1px solid #CBD5E1' : '1px solid #214AAB',
              cursor: !isFormValid ? 'not-allowed' : 'pointer',
              boxShadow: !isFormValid ? 'none' : '0 3px 8px rgba(33, 74, 171, 0.25)',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? 'Generating ECDH Keys...' : 'Register Account'}
          </button>
        </form>

        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #EBEAEA', textAlign: 'center', fontSize: '0.85rem', color: '#606060' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#214AAB', fontWeight: 600, textDecoration: 'none' }}>
            Sign In Directly
          </Link>
        </div>
      </div>
    </div>
  )
}
