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
import { LanguageProvider, useLanguage } from './context/LanguageContext'

const BackendStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null)
  const { isHindi } = useLanguage()

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
      title={isOnline ? 'Backend connection healthy' : 'Backend connection unavailable'}
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
      {isHindi ? 'सर्वर: ' : 'Server: '}
      {isOnline ? (isHindi ? 'ऑनलाइन' : 'Online') : (isHindi ? 'ऑफ़लाइन' : 'Offline')}
    </div>
  )
}

const AppContent: React.FC = () => {
  const navigate = useNavigate()
  const { language, toggleLanguage, t } = useLanguage()

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

  const handleLoginSuccess = (username: string, adminFlag: boolean) => {
    setCurrentUser(username)
    setIsAdmin(adminFlag)
    getStoredPrivateKey(username).then(key => setHasPrivateKey(!!key)).catch(() => setHasPrivateKey(false))
    refreshProfile()
    checkUnread()
    setToastMessage(t(`Welcome back, ${username}!`, `वापसी पर स्वागत है, ${username}!`))
    setTimeout(() => setToastMessage(''), 4000)
    navigate(adminFlag ? '/admin' : '/inbox')
  }

  const handleDeleteAccount = async () => {
    const confirmText = t(
      'Are you sure you want to permanently delete your account? All keys and pending transfers will be purged.',
      'क्या आप वाकई अपना खाता स्थायी रूप से हटाना चाहते हैं? सभी कुंजियाँ और लंबित स्थानांतरण मिटा दिए जाएंगे।'
    )
    if (!window.confirm(confirmText)) {
      return
    }
    try {
      await api.auth.deleteAccount()
      if (currentUser) {
        await clearStoredPrivateKey(currentUser)
      }
      handleLogout()
      setToastMessage(t('Your account has been deleted permanently.', 'आपका खाता स्थायी रूप से हटा दिया गया है।'))
      setTimeout(() => setToastMessage(''), 4000)
      navigate('/')
    } catch (err: any) {
      alert(err.message || t('Failed to delete account.', 'खाता हटाने में विफल।'))
    }
  }

  return (
    <div
      className="app-container"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        color: '#150202',
      }}
    >
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
        <div
          className="toast-notification"
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            zIndex: 10000,
            background: '#E6F4EA',
            border: '1px solid #198754',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            color: '#198754',
            fontWeight: 600,
          }}
        >
          {toastMessage}
        </div>
      )}

      <BackendStatusIndicator />

      {/* Main Content Area with Skip Link anchor id */}
      <main id="main-content" className="main-content" style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {currentUser && !hasPrivateKey && !isAdmin && (
          <div style={{ maxWidth: '1100px', margin: '1rem auto 0', padding: '0 1rem' }}>
            <div className="alert alert-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>ℹ️</span>
              <div>
                <strong>{t('Crypto Key Alert:', 'क्रिप्टो कुंजी चेतावनी:')}</strong>{' '}
                {t(
                  "Long-term private key not detected in your browser's IndexedDB. Generate or restore your cryptographic identity on the Register page.",
                  'आपके ब्राउज़र के IndexedDB में दीर्घकालिक निजी कुंजी नहीं मिली। पंजीकरण पृष्ठ पर अपनी क्रिप्टोग्राफ़िक पहचान उत्पन्न करें या पुनर्स्थापित करें।'
                )}
              </div>
            </div>
          </div>
        )}

        <Routes>
          {/* Landing / Home */}
          <Route path="/" element={<LandingPage />} />

          {/* User Authentication & Services */}
          <Route path="/register" element={<RegisterPage onRegisterSuccess={(uname) => handleLoginSuccess(uname, false)} />} />
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
                    <h2 style={{ color: '#DC3545', marginBottom: '1rem' }}>
                      {t('Administrative Access Restricted', 'प्रशासनिक पहुँच प्रतिबंधित')}
                    </h2>
                    <p style={{ color: '#606060', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                      {t(
                        'System Audit Logs and Forensic Oversight are restricted to authorized administrators only.',
                        'सिस्टम ऑडिट लॉग और फोरेंसिक निगरानी केवल अधिकृत प्रशासकों तक सीमित है।'
                      )}
                    </p>
                    <Link to="/login" className="btn-primary" style={{ backgroundColor: '#214AAB' }}>
                      {t('Sign in as Administrator', 'प्रशासक के रूप में साइन इन करें')}
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

      {/* Cookie Consent Banner */}
      <CookieBanner />
    </div>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}
