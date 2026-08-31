import { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'

import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import UploadPage from './pages/UploadPage'
import InboxPage from './pages/InboxPage'
import AdminPage from './pages/AdminPage'
import { setAuthToken } from './api/client'
import { getStoredPrivateKey } from '../../crypto/src/keystore'

import { Navigate } from 'react-router-dom'

function Navigation({ user, isAdmin, onLogout }: { user: string | null; isAdmin: boolean; onLogout: () => void }) {
  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1.2rem 2rem',
      background: 'rgba(18, 25, 41, 0.6)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      marginBottom: '2rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          color: '#fff'
        }}>🛡️</div>
        <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontSize: '1.25rem', fontWeight: 700 }}>
          Secure<span className="gradient-text">Share</span>
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {user ? (
          <>
            <Link to="/upload" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 500 }}>📤 Send File</Link>
            <Link to="/inbox" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 500 }}>📥 Inbox</Link>
            {isAdmin && (
              <Link to="/admin" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600, background: 'rgba(99, 102, 241, 0.1)', padding: '0.3rem 0.7rem', borderRadius: '6px' }}>
                ⚙️ Audit Logs (Admin)
              </Link>
            )}
            <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.9rem' }}>
              👤 {user} {isAdmin && <span className="badge badge-pending" style={{ fontSize: '0.7rem', marginLeft: '4px' }}>ADMIN</span>}
            </span>
            <button onClick={onLogout} className="btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-secondary" style={{ textDecoration: 'none', padding: '0.5rem 1rem' }}>Login</Link>
            <Link to="/register" className="btn-primary" style={{ textDecoration: 'none', padding: '0.5rem 1rem' }}>Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(() => localStorage.getItem('sfs_username'))
  const [isAdmin, setIsAdmin] = useState<boolean>(() => localStorage.getItem('sfs_is_admin') === 'true')
  const [hasPrivateKey, setHasPrivateKey] = useState<boolean>(false)

  useEffect(() => {
    if (!currentUser) {
      setHasPrivateKey(false)
      return
    }
    getStoredPrivateKey(currentUser).then(key => setHasPrivateKey(!!key)).catch(() => setHasPrivateKey(false))
  }, [currentUser])

  const handleLoginSuccess = (username: string, adminStatus: boolean = false) => {
    localStorage.setItem('sfs_username', username)
    localStorage.setItem('sfs_is_admin', adminStatus ? 'true' : 'false')
    setCurrentUser(username)
    setIsAdmin(adminStatus)
  }

  const handleLogout = () => {
    setAuthToken(null)
    localStorage.removeItem('sfs_username')
    localStorage.removeItem('sfs_is_admin')
    setCurrentUser(null)
    setIsAdmin(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navigation user={currentUser} isAdmin={isAdmin} onLogout={handleLogout} />
      
      <main className="app-container" style={{ flex: 1 }}>
        {currentUser && !hasPrivateKey && currentUser !== 'admin' && (
          <div className="alert alert-info">
            💡 <strong>Crypto Key Alert:</strong> Long-term private key not detected in IndexedDB. Generate or restore your cryptographic identity on the Register page.
          </div>
        )}

        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/register" element={<RegisterPage onRegisterSuccess={handleLoginSuccess} />} />
          <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route
            path="/admin"
            element={
              isAdmin ? (
                <AdminPage />
              ) : (
                <div style={{ maxWidth: '500px', margin: '3rem auto', textAlign: 'center' }} className="glass-card">
                  <h3 style={{ color: '#ef4444', marginBottom: '1rem' }}>⛔ Access Restricted</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    Audit Logs are restricted to system administrators only. Please log in with the administrator account.
                  </p>
                  <Link to="/login" className="btn-primary" style={{ textDecoration: 'none' }}>
                    Sign in as Admin
                  </Link>
                </div>
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '1.5rem',
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
        borderTop: '1px solid var(--border-card)',
        marginTop: '3rem'
      }}>
        Secure E2EE File Sharing • Zero-Knowledge Architecture (FastAPI + React + Web Crypto API)
      </footer>
    </div>
  )
}

