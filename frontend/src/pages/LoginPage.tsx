import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setAuthToken } from '../api/client'

interface LoginPageProps {
  onLoginSuccess: (username: string) => void
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaChallengeToken, setMfaChallengeToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await api.auth.login({
        username_or_email: usernameOrEmail,
        password,
      })

      if (res.mfa_required && res.mfa_challenge_token) {
        setMfaChallengeToken(res.mfa_challenge_token)
      } else if (res.session_token) {
        setAuthToken(res.session_token)
        onLoginSuccess(usernameOrEmail)
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
        username_or_email: usernameOrEmail,
        code: mfaCode,
        mfa_challenge_token: mfaChallengeToken,
      })

      if (res.session_token) {
        setAuthToken(res.session_token)
        onLoginSuccess(usernameOrEmail)
        navigate('/upload')
      } else {
        setError('MFA verification failed')
      }
    } catch (err: any) {
      setError(err.message || 'Invalid MFA code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '440px', margin: '2rem auto' }} className="glass-card">
      <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>
        {mfaChallengeToken ? 'MFA Verification' : 'Welcome Back'}
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '1.5rem' }}>
        {mfaChallengeToken ? 'Enter your 6-digit authenticator code' : 'Sign in to access encrypted file transfers'}
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      {mfaChallengeToken ? (
        <form onSubmit={handleMfaSubmit}>
          <div className="form-group">
            <label>6-Digit Authenticator Code</label>
            <input
              type="text"
              required
              maxLength={6}
              className="form-control"
              placeholder="e.g. 000000"
              value={mfaCode}
              onChange={e => setMfaCode(e.target.value)}
              style={{ letterSpacing: '0.25rem', textAlign: 'center', fontSize: '1.25rem' }}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? 'Verifying...' : 'Verify MFA & Sign In'}
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
            <input
              type="password"
              required
              className="form-control"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      )}
    </div>
  )
}
