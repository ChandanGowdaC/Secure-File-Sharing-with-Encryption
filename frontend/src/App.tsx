import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { UploadPage } from './pages/UploadPage'
import { InboxPage } from './pages/InboxPage'
import { AdminPage } from './pages/AdminPage'
import { LandingPage } from './pages/LandingPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { ChangePasswordPage } from './pages/ChangePasswordPage'
import { api, setAuthToken } from './api/client'
import { getStoredPrivateKey, clearStoredPrivateKey } from '../../crypto/src/keystore'

interface NavigationProps {
  user: string | null
  isAdmin: boolean
  lastLogin: string | null
  unreadCount: number
  onLogout: () => void
  onDeleteAccount: () => void
}

const Navigation: React.FC<NavigationProps> = ({
  user,
  isAdmin,
  lastLogin,
  unreadCount,
  onLogout,
  onDeleteAccount,
}) => {
  const location = useLocation()

  return (
    <nav className="nav-bar">
      <Link to="/" className="nav-brand">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-accent)' }}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        SFS
      </Link>
      <div className="nav-links">
        {user ? (
          <>
            <Link to="/upload" className={`nav-link ${location.pathname === '/upload' ? 'active' : ''}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload
            </Link>
            <Link to="/inbox" className={`nav-link ${location.pathname === '/inbox' ? 'active' : ''}`} style={{ position: 'relative' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Inbox
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-15px',
                    background: 'var(--danger-color)',
                    color: '#fff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '10px',
                    lineHeight: '1.1',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </Link>
            {isAdmin && (
              <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
                Audit Logs
              </Link>
            )}

            <Link to="/change-password" className={`nav-link ${location.pathname === '/change-password' ? 'active' : ''}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Change Password
            </Link>

            {/* Responsive User Identity & Last Login Display */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                padding: '0.25rem 0.6rem',
                background: 'rgba(241, 245, 249, 0.6)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                lineHeight: '1.25',
              }}
            >
              <span
                style={{
                  color: 'var(--text-main)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-accent)' }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {user} {isAdmin && <span className="badge badge-admin" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>ADMIN</span>}
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '1px',
                }}
                title={lastLogin ? new Date(lastLogin).toLocaleString() : 'First session'}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {lastLogin
                  ? `Last: ${new Date(lastLogin).toLocaleDateString([], { month: 'short', day: 'numeric' })} ${new Date(lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Active now'}
              </span>
            </div>

            <button onClick={onLogout} className="btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}>
              Logout
            </button>
            {!isAdmin && (
              <button onClick={onDeleteAccount} className="btn-danger" style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}>
                Delete Account
              </button>
            )}
          </>
        ) : (
          <>
            <Link to="/login" className="btn-secondary" style={{ textDecoration: 'none', padding: '0.5rem 1rem' }}>
              Login
            </Link>
            <Link to="/register" className="btn-primary" style={{ textDecoration: 'none', padding: '0.5rem 1rem' }}>
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

const BackendStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    const checkHealth = async () => {
      try {
        await api.health()
        if (mounted) setIsOnline(true)
      } catch {
        if (mounted) setIsOnline(false)
      }
    }
    checkHealth()
    const interval = setInterval(checkHealth, 8000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  if (isOnline === null) return null

  return (
    <div
      className={`status-indicator ${isOnline ? 'status-online' : 'status-offline'}`}
      title={isOnline ? 'FastAPI Backend connection healthy' : 'Backend connection unavailable'}
    >
      <div className="status-dot" />
      Backend: {isOnline ? 'Online' : 'Offline'}
    </div>
  )
}

export default function App() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<string | null>(() => localStorage.getItem('sfs_username'))
  const [isAdmin, setIsAdmin] = useState<boolean>(() => localStorage.getItem('sfs_is_admin') === 'true')
  const [lastLoginAt, setLastLoginAt] = useState<string | null>(() => localStorage.getItem('sfs_last_login'))
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [hasPrivateKey, setHasPrivateKey] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<string>('')

  const checkUnread = async () => {
    if (!currentUser) {
      setUnreadCount(0)
      return
    }
    try {
      const res = await api.transfers.pending()
      if (res && res.transfers) {
        setUnreadCount(res.transfers.length)
      }
    } catch {
      // ignore
    }
  }

  // Refresh profile & last login timestamp from backend
  const refreshProfile = async () => {
    if (!currentUser) return
    try {
      const me = await api.auth.me()
      if (me && me.last_login_at) {
        localStorage.setItem('sfs_last_login', me.last_login_at)
        setLastLoginAt(me.last_login_at)
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    const handleAuthExpired = () => {
      handleLogout()
    }
    window.addEventListener('sfs_auth_expired', handleAuthExpired)
    return () => window.removeEventListener('sfs_auth_expired', handleAuthExpired)
  }, [])

  useEffect(() => {
    if (!currentUser) {
      setHasPrivateKey(false)
      setUnreadCount(0)
      return
    }
    getStoredPrivateKey(currentUser).then(key => setHasPrivateKey(!!key)).catch(() => setHasPrivateKey(false))
    checkUnread()
    refreshProfile()
    const interval = setInterval(checkUnread, 8000)
    return () => clearInterval(interval)
  }, [currentUser])

  const handleLoginSuccess = (username: string, adminStatus: boolean = false, lastLogin?: string | null) => {
    localStorage.setItem('sfs_username', username)
    localStorage.setItem('sfs_is_admin', adminStatus ? 'true' : 'false')
    if (lastLogin) {
      localStorage.setItem('sfs_last_login', lastLogin)
      setLastLoginAt(lastLogin)
    }
    setCurrentUser(username)
    setIsAdmin(adminStatus)
  }

  const handleLogout = () => {
    setAuthToken(null)
    localStorage.removeItem('sfs_username')
    localStorage.removeItem('sfs_is_admin')
    localStorage.removeItem('sfs_last_login')
    setCurrentUser(null)
    setIsAdmin(false)
    setLastLoginAt(null)
  }

  const handleDeleteAccount = async () => {
    if (!currentUser || isAdmin) return
    const confirmed = window.confirm(
      'Delete your account permanently? Your queued encrypted transfers and account metadata will be removed. This cannot be undone.'
    )
    if (!confirmed) return

    try {
      await api.auth.deleteAccount()
      await clearStoredPrivateKey(currentUser)
      handleLogout()
      setToastMessage('Your account has been successfully deleted.')
      setTimeout(() => setToastMessage(''), 5000)
      navigate('/', { replace: true })
    } catch (err: any) {
      window.alert(err.message || 'Account deletion failed. Please try again.')
    }
  }

  return (
    <div className="app-container">
      <Navigation
        user={currentUser}
        isAdmin={isAdmin}
        lastLogin={lastLoginAt}
        unreadCount={unreadCount}
        onLogout={handleLogout}
        onDeleteAccount={handleDeleteAccount}
      />

      {toastMessage && (
        <div className="toast-notification">
          {toastMessage}
        </div>
      )}

      <BackendStatusIndicator />

      <main className="main-content">
        {currentUser && !hasPrivateKey && !isAdmin && (
          <div className="alert alert-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '8px' }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <strong>Crypto Key Alert:</strong> Long-term private key not detected in IndexedDB. Generate or restore your cryptographic identity on the Register page.
          </div>
        )}

        <Routes>
          <Route path="/" element={currentUser ? <UploadPage /> : <LandingPage />} />
          <Route path="/register" element={<RegisterPage onRegisterSuccess={handleLoginSuccess} />} />
          <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route
            path="/admin"
            element={
              isAdmin ? (
                <AdminPage />
              ) : (
                <div className="page-shell page-shell-narrow">
                  <div className="glass-card text-center">
                    <h3 style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>Access Restricted</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                      Audit Logs are restricted to system administrators only. Please log in with the administrator account.
                    </p>
                    <Link to="/login" className="btn-primary">
                      Sign in as Admin
                    </Link>
                  </div>
                </div>
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer>
        &copy; 2026 Secure File Sharing with Encryption
      </footer>
    </div>
  )
}
