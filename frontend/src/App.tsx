import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'

import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import UploadPage from './pages/UploadPage'
import InboxPage from './pages/InboxPage'
import AdminPage from './pages/AdminPage'
import { getAuthToken, setAuthToken } from './api/client'
import { getStoredPrivateKey } from '../../crypto/src/keystore'

function Navigation({ user, onLogout }: { user: string | null; onLogout: () => void }) {
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
            <Link to="/admin" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 500 }}>⚙️ Audit Logs</Link>
            <span style={{ color: '#6366f1', fontWeight: 600, fontSize: '0.9rem' }}>👤 {user}</span>
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
  const [hasPrivateKey, setHasPrivateKey] = useState<boolean>(false)

  useEffect(() => {
    getStoredPrivateKey().then(key => setHasPrivateKey(!!key)).catch(() => setHasPrivateKey(false))
  }, [currentUser])

  const handleLoginSuccess = (username: string) => {
    localStorage.setItem('sfs_username', username)
    setCurrentUser(username)
  }

  const handleLogout = () => {
    setAuthToken(null)
    localStorage.removeItem('sfs_username')
    setCurrentUser(null)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navigation user={currentUser} onLogout={handleLogout} />
      
      <main className="app-container" style={{ flex: 1 }}>
        {currentUser && !hasPrivateKey && (
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
          <Route path="/admin" element={<AdminPage />} />
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

