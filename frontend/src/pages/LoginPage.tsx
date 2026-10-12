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
    if (!usernameOrEmail.trim() || !password) return
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
              ? `A 6-digit verification code has been sent to ${res.masked_email}`
              : 'A 6-digit verification code has been sent to your registered email.')
        )
      } else if (res.session_token) {
        setAuthToken(res.session_token)
        const loggedUsername = res.username || usernameOrEmail.trim()
        onLoginSuccess(loggedUsername, !!res.is_admin, res.last_login_at)
        navigate('/upload')
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mfaChallengeToken) return

    const trimmedCode = mfaCode.trim()
    if (trimmedCode.length < 6) {
      setError('Please enter the complete 6-digit verification code.')
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
      setError(err.message || 'Invalid or expired 6-digit verification code.')
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
      setMfaNotice(res.message || 'A new verification code has been dispatched to your email.')
      setResendCooldown(30)
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.')
    } finally {
      setResending(false)
    }
  }

  const isFormValid = usernameOrEmail.trim().length > 0 && password.length > 0

  return (
    <div className="page-shell page-shell-narrow" style={{ padding: '1.5rem 1rem' }}>
      {/* Breadcrumb Trail (DBIM Section 4.5.ii) */}
      <nav aria-label="Breadcrumb" style={{ fontSize: '0.82rem', color: '#606060', marginBottom: '1rem' }}>
        <Link to="/" style={{ color: '#214AAB', textDecoration: 'none' }}>Home</Link>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span style={{ color: '#150202', fontWeight: 600 }}>Sign In</span>
      </nav>

      <div className="glass-card" style={{ background: '#FFFFFF', border: '1px solid #EBEAEA', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#162F6A', textAlign: 'center', margin: '0 0 0.5rem' }}>
          {mfaChallengeToken ? 'Two-Factor Authentication' : 'Sign In to Portal'}
        </h1>
        <p style={{ color: '#606060', fontSize: '0.88rem', textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          {mfaChallengeToken
            ? 'Enter the 6-digit one-time passcode sent to your registered official email.'
            : 'Access zero-knowledge encrypted file transfers and browser cryptographic identity.'}
        </p>

        {/* Instructions at the starting of form (DBIM Annexure B.i, Page 109/129) */}
        <div style={{ background: '#F8FAFC', border: '1px solid #EBEAEA', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#606060', lineHeight: 1.5 }}>
          <strong>Instructions:</strong> Please fill in all mandatory fields marked with an asterisk (*). Ensure your browser supports IndexedDB for private key storage.
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {mfaNotice && <div className="alert alert-info">{mfaNotice}</div>}

        {mfaChallengeToken ? (
          /* MFA Verification Form (Annexure B - Single column vertical layout) */
          <form onSubmit={handleMfaSubmit}>
            <div className="form-group" style={{ textAlign: 'center' }}>
              <label htmlFor="mfa-input" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#150202', fontSize: '0.9rem' }}>
                6-Digit Verification Code <span style={{ color: '#DC3545' }}>*</span> <span style={{ fontSize: '0.75rem', color: '#606060' }}>(Required)</span>
              </label>

              <div className="otp-input-wrap">
                <input
                  id="mfa-input"
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
                    border: '2px solid #5279D7',
                    borderRadius: '8px',
                    color: '#162F6A',
                    backgroundColor: '#FFFFFF',
                  }}
                />
              </div>

              {/* Resend & Clipboard Controls */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || resending}
                  className="btn-secondary"
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '6px',
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
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', borderRadius: '6px' }}
                >
                  Paste from Clipboard
                </button>
              </div>

              <span className="field-help" style={{ display: 'block', color: '#606060', fontSize: '0.8rem' }}>
                Check your inbox and spam folder for the one-time passcode.
              </span>
            </div>

            {/* Primary Action Button - disabled until complete 6 digits entered (Annexure B.xiv) */}
            <button
              type="submit"
              disabled={loading || mfaCode.length < 6}
              className="btn-primary btn-full"
              style={{
                marginTop: '1.25rem',
                backgroundColor: mfaCode.length < 6 ? '#CBD5E1' : '#214AAB',
                color: '#FFFFFF',
                cursor: mfaCode.length < 6 ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Verifying...' : 'Verify Code & Sign In'}
            </button>

            {/* Secondary Action Button with less visual weight (Annexure B.xiii) */}
            <button
              type="button"
              className="btn-secondary btn-full"
              style={{ marginTop: '0.75rem', background: '#FFFFFF', border: '1px solid #C6C6C6' }}
              onClick={() => {
                setMfaChallengeToken(null)
                setMfaNotice(null)
                setMfaCode('')
              }}
            >
              Back to Sign In
            </button>
          </form>
        ) : (
          /* Login Form (Annexure B - Single column vertical layout, Figure 81) */
          <form onSubmit={handleLoginSubmit}>
            {/* Field 1: Username or Email */}
            <div className="form-group">
              <label htmlFor="login-username" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#150202', marginBottom: '4px' }}>
                Username or Official Email <span style={{ color: '#DC3545' }}>*</span> <span style={{ fontSize: '0.75rem', color: '#606060' }}>(Required)</span>
              </label>
              <input
                id="login-username"
                type="text"
                required
                className="form-control"
                placeholder="e.g. officer@nic.in or username"
                value={usernameOrEmail}
                onChange={e => setUsernameOrEmail(e.target.value)}
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #C6C6C6' }}
              />
              <span className="field-help" style={{ color: '#606060', fontSize: '0.78rem', marginTop: '2px' }}>
                Enter your registered government username or email address.
              </span>
            </div>

            {/* Field 2: Password */}
            <div className="form-group" style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label htmlFor="login-password" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#150202' }}>
                  Password <span style={{ color: '#DC3545' }}>*</span> <span style={{ fontSize: '0.75rem', color: '#606060' }}>(Required)</span>
                </label>
                <Link to="/forgot-password" className="forgot-password-link" style={{ fontSize: '0.8rem', color: '#214AAB' }}>
                  Forgot Password?
                </Link>
              </div>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="form-control"
                  placeholder="Enter your secure password"
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
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <span className="field-help" style={{ color: '#606060', fontSize: '0.78rem', marginTop: '2px' }}>
                Case-sensitive alphanumeric password.
              </span>
            </div>

            {/* Primary Action Button - disabled until fields entered (Annexure B.xiv) */}
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
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #EBEAEA', textAlign: 'center', fontSize: '0.85rem', color: '#606060' }}>
          Don&apos;t have a registered cryptographic identity?{' '}
          <Link to="/register" style={{ color: '#214AAB', fontWeight: 600, textDecoration: 'none' }}>
            Register New Account
          </Link>
        </div>
      </div>
    </div>
  )
}
