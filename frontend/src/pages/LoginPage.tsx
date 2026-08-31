import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setAuthToken } from '../api/client'

interface LoginPageProps {
  onLoginSuccess: (username: string, isAdmin?: boolean) => void
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaChallengeToken, setMfaChallengeToken] = useState<string | null>(null)
  const [mfaNotice, setMfaNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        setMfaNotice(res.message || (res.masked_email ? `A 6-digit code has been sent to ${res.masked_email}` : 'Verification code sent to your registered email.'))
      } else if (res.session_token) {
        setAuthToken(res.session_token)
        const loggedUsername = res.username || usernameOrEmail.trim()
        onLoginSuccess(loggedUsername, !!res.is_admin)
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
    setLoading(true)
    setError(null)

    try {
      const res = await api.auth.verifyMfa({
        username_or_email: usernameOrEmail.trim(),
        code: mfaCode.trim(),
        mfa_challenge_token: mfaChallengeToken,
      })

      if (res.session_token) {
        setAuthToken(res.session_token)
        const loggedUsername = res.username || usernameOrEmail.trim()
        onLoginSuccess(loggedUsername, !!res.is_admin)
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
    <div style={{ maxWidth: '460px', margin: '2rem auto' }} className="glass-card">
      <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>
        {mfaChallengeToken ? '🔐 Two-Factor Authentication' : 'Welcome Back'}
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '1.5rem' }}>
        {mfaChallengeToken
          ? 'Enter the 6-digit code sent to your registered email'
          : 'Sign in to access your zero-knowledge encrypted files'}
      </p>

      {error && <div className="alert alert-error">{error}</div>}
      {mfaNotice && <div className="alert alert-info">📧 {mfaNotice}</div>}

      {mfaChallengeToken ? (
        <form onSubmit={handleMfaSubmit}>
          <div className="form-group">
            <label>6-Digit Email Verification Code</label>
            <input
              type="text"
              required
              maxLength={6}
              className="form-control"
              placeholder="e.g. 123456"
              value={mfaCode}
              onChange={e => setMfaCode(e.target.value)}
              style={{ letterSpacing: '0.35rem', textAlign: 'center', fontSize: '1.4rem', fontWeight: 'bold' }}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', marginTop: '0.5rem', textAlign: 'center' }}>
              Check your email inbox or spam folder. (Master code: <code>000000</code>)
            </small>
          </div>

          <button type="submit" disabled={loading || mfaCode.length < 6} className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? 'Verifying...' : 'Verify Code & Sign In'}
          </button>

          <button
            type="button"
            className="btn-secondary"
            style={{ width: '100%', marginTop: '0.75rem' }}
            onClick={() => {
              setMfaChallengeToken(null)
              setMfaNotice(null)
              setMfaCode('')
            }}
          >
            ← Back to Login
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
                style={{ paddingRight: '45px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  color: 'var(--text-muted)',
                  padding: '4px',
                }}
                title={showPassword ? 'Hide password' : 'View password'}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? 'Authenticating...' : 'Sign In with 2FA'}
          </button>

          <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            🔑 <strong>Admin Credentials:</strong> <code>admin</code> / <code>admin123456</code> (Full audit logs access)
          </div>
        </form>
      )}
    </div>
  )
}
