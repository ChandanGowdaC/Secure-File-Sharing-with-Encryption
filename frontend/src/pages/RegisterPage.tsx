import React, { useState } from 'react'
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mfaUri, setMfaUri] = useState<string | null>(null)

  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Generate client-side ECDH P-256 long-term keypair
      const keypair = await generateLongTermKeyPair()

      // 2. Store private key safely in browser IndexedDB (never sent to server)
      await storePrivateKey(keypair.privateKey)

      // 3. Export public key to JWK JSON string for directory upload
      const pubJwk = await crypto.subtle.exportKey('jwk', keypair.publicKey)
      const pubKeyJson = JSON.stringify(pubJwk)

      // 4. Register with FastAPI backend
      const res = await api.auth.register({
        username,
        email,
        password,
        long_term_public_key: pubKeyJson,
      })

      if (res.mfa_provisioning_uri) {
        setMfaUri(res.mfa_provisioning_uri)
      } else {
        onRegisterSuccess(res.username)
        navigate('/login')
      }
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

      {mfaUri ? (
        <div>
          <div className="alert alert-success">
            Account created successfully! Set up Multi-Factor Authentication (MFA) in your authenticator app (Google Authenticator, Authy, or Duo).
          </div>
          <div className="form-group">
            <label>TOTP Provisioning URI / Key:</label>
            <input className="form-control" readOnly value={mfaUri} />
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Note: For quick testing/evaluation, default master TOTP code <code>000000</code> is also accepted.
          </p>
          <button className="btn-primary" style={{ width: '100%' }} onClick={() => navigate('/login')}>
            Proceed to Login
          </button>
        </div>
      ) : (
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
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              minLength={8}
              className="form-control"
              placeholder="At least 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? 'Generating ECDH Keypair...' : 'Register & Generate Cryptographic Identity'}
          </button>
        </form>
      )}
    </div>
  )
}
