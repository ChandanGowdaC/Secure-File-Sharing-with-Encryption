import React, { useRef, useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, setAuthToken } from '../api/client'

interface LoginPageProps {
  onLoginSuccess: (username: string, isAdmin?: boolean, lastLoginAt?: string | null) => void
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaChallengeToken, setMfaChallengeToken] = useState<string | null>(null)
  const [mfaNotice, setMfaNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(30)
  const [resending, setResending] = useState(false)

  const otpInputRef = useRef<HTMLInputElement | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (mfaChallengeToken && otpInputRef.current) {
      otpInputRef.current.focus()
    }
  }, [mfaChallengeToken])

  useEffect(() => {
    if (!mfaChallengeToken) return
    setResendCooldown(30)
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [mfaChallengeToken])

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await api.auth.login({
        username_or_email: usernameOrEmail.trim(),
        password,
      })

      if (res.mfa_required && res.mfa_challenge_token) {
        setMfaChallengeToken(res.mfa_challenge_token)
        setMfaCode('')
        setMfaNotice(
          res.message ||
            (res.masked_email
              ? `A 6-digit code has been sent to ${res.masked_email}`
              : 'Verification code sent to your registered email.')
        )
      } else if (res.session_token) {
        setAuthToken(res.session_token)
        const loggedUsername = res.username || usernameOrEmail.trim()
        onLoginSuccess(loggedUsername, !!res.is_admin, res.last_login_at)
        navigate('/upload')
      }
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mfaChallengeToken) return

    const trimmedCode = mfaCode.trim()
    if (trimmedCode.length < 6) {
      setError('Please enter the 6-digit verification code.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await api.auth.verifyMfa({
        username_or_email: usernameOrEmail.trim(),
        code: trimmedCode,
        mfa_challenge_token: mfaChallengeToken,
      })

      if (res.session_token) {
        setAuthToken(res.session_token)
        const loggedUsername = res.username || usernameOrEmail.trim()
        onLoginSuccess(loggedUsername, !!res.is_admin, res.last_login_at)
        navigate('/upload')
      } else {
        setError('Verification failed. Please try again.')
      }
    } catch (err: any) {
      setError(err.message || 'Invalid or expired 6-digit code')
    } finally {
      setLoading(false)
    }
  }

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const digits = text.replace(/\D/g, '').slice(0, 6)
      if (digits) {
        setMfaCode(digits)
        setError(null)
        otpInputRef.current?.focus()
      }
    } catch {
      // ignore
    }
  }

  const handleResendOtp = async () => {
    if (!mfaChallengeToken || resendCooldown > 0 || resending) return
    setResending(true)
    setError(null)
    try {
      const res = await api.auth.resendMfa({
        mfa_challenge_token: mfaChallengeToken,
        username_or_email: usernameOrEmail.trim(),
      })
      if (res.mfa_challenge_token) {
        setMfaChallengeToken(res.mfa_challenge_token)
      }
      setMfaNotice(res.message || 'A new verification code has been sent to your email.')
      setResendCooldown(30)
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="page-shell page-shell-narrow">
      <div className="glass-card">
        <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>
          {mfaChallengeToken ? 'Two-Factor Authentication' : 'Welcome Back'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          {mfaChallengeToken
            ? 'Enter the 6-digit code sent to your registered email'
            : 'Sign in to access your zero-knowledge encrypted files'}
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {mfaNotice && <div className="alert alert-info">{mfaNotice}</div>}

        {mfaChallengeToken ? (
          <form onSubmit={handleMfaSubmit}>
            <div className="form-group" style={{ textAlign: 'center' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
                6-Digit Verification Code
              </label>

              <div className="otp-input-wrap">
                <input
                  ref={otpInputRef}
                  type="text"
                  required
                  autoFocus
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={mfaCode}
                  onChange={e => {
                    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setMfaCode(cleaned)
                    if (error) setError(null)
                  }}
                  className="form-control otp-input"
                  placeholder="000000"
                  style={{
                    borderColor: mfaCode.length === 6 ? 'var(--primary-accent)' : '#cbd5e1',
                    boxShadow: mfaCode.length === 6 ? '0 0 0 3px rgba(91, 141, 239, 0.2)' : 'none',
                  }}
                />
              </div>

              {/* Resend Code & Paste Helpers */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || resending}
                  className="btn-secondary"
                  style={{
                    fontSize: '0.82rem',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '8px',
                    opacity: resendCooldown > 0 ? 0.65 : 1,
                    cursor: resendCooldown > 0 || resending ? 'not-allowed' : 'pointer',
                  }}
                >
                  {resending
                    ? 'Resending...'
                    : resendCooldown > 0
                    ? `Resend Code (${resendCooldown}s)`
                    : 'Resend Code'}
                </button>
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="btn-secondary"
                  style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem', borderRadius: '8px' }}
                >
                  Paste from Clipboard
                </button>
              </div>

              <small style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Enter the 6-digit verification code sent to your email.
              </small>
            </div>

            <button
              type="submit"
              disabled={loading || mfaCode.length < 6}
              className="btn-primary btn-full"
              style={{ marginTop: '1rem' }}
            >
              {loading ? 'Verifying...' : 'Verify Code & Sign In'}
            </button>

            <button
              type="button"
              className="btn-secondary btn-full"
              style={{ marginTop: '0.75rem' }}
              onClick={() => {
                setMfaChallengeToken(null)
                setMfaNotice(null)
                setMfaCode('')
              }}
            >
              Back to Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label>Username or Email</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Username or email"
                value={usernameOrEmail}
                onChange={e => setUsernameOrEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="form-control"
                  placeholder="Password"
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
              <div style={{ marginTop: '0.25rem', textAlign: 'right' }}>
                <Link to="/forgot-password" className="forgot-password-link">Forgot Password?</Link>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary btn-full" style={{ marginTop: '1rem' }}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
