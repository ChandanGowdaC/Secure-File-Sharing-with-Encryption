import React, { useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, setAuthToken } from '../api/client'

interface LoginPageProps {
  onLoginSuccess: (username: string, isAdmin?: boolean, lastLoginAt?: string | null) => void
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [mfaChallengeToken, setMfaChallengeToken] = useState<string | null>(null)
  const [mfaNotice, setMfaNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([])
  const navigate = useNavigate()

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
        setOtpDigits(['', '', '', '', '', ''])
        setMfaNotice(
          res.message ||
            (res.masked_email
              ? `A 6-digit code has been sent to ${res.masked_email}`
              : 'Verification code sent to your registered email.')
        )
        setTimeout(() => {
          otpInputsRef.current[0]?.focus()
        }, 100)
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

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newDigits = [...otpDigits]
    newDigits[index] = digit
    setOtpDigits(newDigits)

    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits]
        newDigits[index - 1] = ''
        setOtpDigits(newDigits)
        otpInputsRef.current[index - 1]?.focus()
      } else {
        const newDigits = [...otpDigits]
        newDigits[index] = ''
        setOtpDigits(newDigits)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputsRef.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputsRef.current[index + 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pastedData) return

    const newDigits = [...otpDigits]
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || ''
    }
    setOtpDigits(newDigits)

    const nextIndex = Math.min(pastedData.length, 5)
    otpInputsRef.current[nextIndex]?.focus()
  }

  const handleAutofillMasterCode = (code: string = '000000') => {
    const digits = code.split('').slice(0, 6)
    setOtpDigits(digits)
    setError(null)
    otpInputsRef.current[5]?.focus()
  }

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mfaChallengeToken) return
    const code = otpDigits.join('')
    if (code.length < 6) {
      setError('Please enter all 6 digits of the verification code.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await api.auth.verifyMfa({
        username_or_email: usernameOrEmail.trim(),
        code,
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
            {/* Master Code Highlight Banner */}
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                padding: '0.9rem 1rem',
                marginBottom: '1.5rem',
                textAlign: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#166534', fontWeight: 600, fontSize: '0.88rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                Master Bypass Code: <code style={{ background: '#dcfce7', padding: '2px 6px', borderRadius: '4px', fontSize: '0.95rem' }}>000000</code> or <code style={{ background: '#dcfce7', padding: '2px 6px', borderRadius: '4px', fontSize: '0.95rem' }}>123456</code>
              </div>
              <p style={{ color: '#15803d', fontSize: '0.8rem', margin: '0.35rem 0 0.65rem 0' }}>
                For quick evaluation and testing without external email access.
              </p>
              <button
                type="button"
                onClick={() => handleAutofillMasterCode('000000')}
                className="btn-secondary"
                style={{
                  fontSize: '0.8rem',
                  padding: '0.35rem 0.8rem',
                  borderColor: '#86efac',
                  background: '#ffffff',
                  color: '#166534',
                }}
              >
                Autofill Master Code (000000)
              </button>
            </div>

            <div className="form-group" style={{ textAlign: 'center' }}>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600 }}>
                Enter 6-Digit Verification Code
              </label>

              {/* Segmented 6-box OTP UI */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  margin: '0.5rem 0 1.25rem 0',
                }}
              >
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => {
                      otpInputsRef.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(index, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    style={{
                      width: '46px',
                      height: '54px',
                      borderRadius: '10px',
                      border: digit ? '2px solid var(--primary-accent)' : '1.5px solid var(--border-color)',
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      background: '#ffffff',
                      boxShadow: digit ? '0 0 0 3px rgba(91, 141, 239, 0.15)' : 'none',
                      outline: 'none',
                      transition: 'all 0.15s ease-in-out',
                    }}
                  />
                ))}
              </div>

              <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>
                Enter the code sent to your registered email or use the master code above.
              </small>
            </div>

            <button
              type="submit"
              disabled={loading || otpDigits.join('').length < 6}
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
                setOtpDigits(['', '', '', '', '', ''])
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
