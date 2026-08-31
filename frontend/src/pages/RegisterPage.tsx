import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { generateLongTermKeyPair } from '../../../crypto/src/keypair'
import { storePrivateKey } from '../../../crypto/src/keystore'

interface RegisterPageProps {
  onRegisterSuccess: (username: string) => void
}

export default function RegisterPage({ onRegisterSuccess }: RegisterPageProps) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify and try again.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setLoading(true)

    try {
      // 1. Generate client-side ECDH P-256 long-term keypair
      const keypair = await generateLongTermKeyPair()

      // 2. Store private key safely in browser IndexedDB (never sent to server)
      await storePrivateKey(username, keypair.privateKey)

      // 3. Register with FastAPI backend (keypair.publicKey is already a JWK JSON string)
      const res = await api.auth.register({
        username,
        email,
        password,
        long_term_public_key: keypair.publicKey,
      })

      onRegisterSuccess(res.username)
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

  return (
    <div style={{ maxWidth: '480px', margin: '2rem auto' }} className="glass-card">
      <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Create Account</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '1.5rem' }}>
        Generates zero-knowledge ECDH keys stored locally in your browser.
      </p>

      {error && <div className="alert alert-error">{error}</div>}
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
              style={{ paddingRight: '45px' }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
              title={showConfirmPassword ? 'Hide password' : 'View password'}
            >
              {showConfirmPassword ? '👁️' : '🙈'}
            </button>
          </div>
          {confirmPassword && password !== confirmPassword && (
            <small style={{ color: '#ef4444', fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>
              ⚠️ Passwords do not match
            </small>
          )}
          {confirmPassword && password === confirmPassword && (
            <small style={{ color: '#10b981', fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>
              ✓ Passwords match
            </small>
          )}
        </div>

        <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
          {loading ? 'Generating ECDH Keypair...' : 'Register & Generate Cryptographic Identity'}
        </button>
      </form>
    </div>
  )
}
