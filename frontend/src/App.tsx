import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { UploadPage } from './pages/UploadPage'
import { InboxPage } from './pages/InboxPage'
import { AdminPage } from './pages/AdminPage'
import { LandingPage } from './pages/LandingPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { ChangePasswordPage } from './pages/ChangePasswordPage'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { CookieBanner } from './components/CookieBanner'
import { api, setAuthToken } from './api/client'
import { getStoredPrivateKey, clearStoredPrivateKey } from './crypto/keystore'

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
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.45rem 0.9rem',
        backgroundColor: '#FFFFFF',
        border: '1px solid #EBEAEA',
        borderRadius: '20px',
        boxShadow: '0 4px 12px rgba(21, 2, 2, 0.08)',
        fontSize: '0.78rem',
        fontWeight: 600,
        zIndex: 9000,
        color: '#150202',
      }}
    >
      <div
        className="status-dot"
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: isOnline ? '#198754' : '#DC3545',
        }}
      />
      Server: {isOnline ? 'Online' : 'Offline'}
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
  const [language, setLanguage] = useState<'en' | 'hi'>('en')

  // Dynamic Language Switch (DBIM Section 7.5.1 ii)
  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'hi' : 'en'
    setLanguage(nextLang)
    document.documentElement.lang = nextLang
  }

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

  const handleLogout = () => {
    setAuthToken(null)
    localStorage.removeItem('sfs_username')
    localStorage.removeItem('sfs_is_admin')
    localStorage.removeItem('sfs_last_login')
    setCurrentUser(null)
    setIsAdmin(false)
    setLastLoginAt(null)
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
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
      {/* Header conforming to GoI DBIM v3 Standards */}
      <Header
        user={currentUser}
        isAdmin={isAdmin}
        lastLogin={lastLoginAt}
        unreadCount={unreadCount}
        onLogout={handleLogout}
        onDeleteAccount={handleDeleteAccount}
        currentLanguage={language}
        onToggleLanguage={toggleLanguage}
      />

      {toastMessage && (
        <div className="toast-notification" style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 10000, background: '#E6F4EA', border: '1px solid #198754', padding: '0.85rem 1.25rem', borderRadius: '8px', color: '#198754', fontWeight: 600 }}>
          {toastMessage}
        </div>
      )}

      <BackendStatusIndicator />

      {/* Main Content Area with Skip Link anchor id (WCAG 2.1 / GIGW 3.0) */}
      <main id="main-content" className="main-content" style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {currentUser && !hasPrivateKey && !isAdmin && (
          <div style={{ maxWidth: '1100px', margin: '1rem auto 0', padding: '0 1rem' }}>
            <div className="alert alert-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>ℹ️</span>
              <div>
                <strong>Crypto Key Alert:</strong> Long-term private key not detected in your browser&apos;s IndexedDB. Generate or restore your cryptographic identity on the Register page.
              </div>
            </div>
          </div>
        )}

        <Routes>
          {/* Landing / Home */}
          <Route path="/" element={<LandingPage />} />

          {/* User Authentication & Services */}
          <Route path="/register" element={<RegisterPage onRegisterSuccess={handleLoginSuccess} />} />
          <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />

          {/* Secure Transfer Services */}
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route
            path="/admin"
            element={
              isAdmin ? (
                <AdminPage />
              ) : (
                <div className="page-shell page-shell-narrow" style={{ padding: '2rem 1rem' }}>
                  <div className="glass-card text-center" style={{ background: '#FFFFFF', border: '1px solid #EBEAEA', borderRadius: '12px', padding: '2rem' }}>
                    <h2 style={{ color: '#DC3545', marginBottom: '1rem' }}>Administrative Access Restricted</h2>
                    <p style={{ color: '#606060', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                      System Audit Logs and Forensic Oversight are restricted to authorized administrators only.
                    </p>
                    <Link to="/login" className="btn-primary" style={{ backgroundColor: '#214AAB' }}>
                      Sign in as Administrator
                    </Link>
                  </div>
                </div>
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Light Color Theme Footer */}
      <Footer />

      {/* DPDP Act 2023 Compliant Cookie Consent Banner */}
      <CookieBanner />
    </div>
  )
}
