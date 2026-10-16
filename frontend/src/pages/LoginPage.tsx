import React, { useRef, useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, setAuthToken } from '../api/client'
import { useLanguage } from '../context/LanguageContext'

interface LoginPageProps {
  onLoginSuccess: (username: string, isAdmin?: boolean, lastLoginAt?: string | null) => void
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { t } = useLanguage()
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaChallengeToken, setMfaChallengeToken] = useState<string | null>(null)
  const [mfaNotice, setMfaNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(30)
  const [resending, setResending] = useState(false)

  const otpInputRef = useRef<HTMLInputElement | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (mfaChallengeToken && otpInputRef.current) {
      otpInputRef.current.focus()
    }
  }, [mfaChallengeToken])

  useEffect(() => {
    if (!mfaChallengeToken) return
    setResendCooldown(30)
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [mfaChallengeToken])

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usernameOrEmail.trim() || !password) return
    setLoading(true)
    setError(null)

    try {
      const res = await api.auth.login({
        username_or_email: usernameOrEmail.trim(),
        password,
      })

      if (res.mfa_required && res.mfa_challenge_token) {
        setMfaChallengeToken(res.mfa_challenge_token)
        setMfaCode('')
        setMfaNotice(
          res.message ||
            (res.masked_email
              ? t(`A 6-digit verification code has been sent to ${res.masked_email}`, `6-अंकीय सत्यापन कोड ${res.masked_email} पर भेज दिया गया है`)
              : t('A 6-digit verification code has been sent to your registered email.', 'आपके पंजीकृत ईमेल पर 6-अंकीय सत्यापन कोड भेजा गया है।'))
        )
      } else if (res.session_token) {
        setAuthToken(res.session_token)
        const loggedUsername = res.username || usernameOrEmail.trim()
        localStorage.setItem('sfs_username', loggedUsername)
        localStorage.setItem('sfs_is_admin', String(!!res.is_admin))
        if (res.last_login_at) {
          localStorage.setItem('sfs_last_login', res.last_login_at)
        }
        onLoginSuccess(loggedUsername, !!res.is_admin, res.last_login_at)
        navigate('/upload')
      }
    } catch (err: any) {
      setError(err.message || t('Authentication failed. Please verify credentials.', 'प्रमाणीकरण विफल। कृपया क्रेडेंशियल्स सत्यापित करें।'))
    } finally {
      setLoading(false)
    }
  }

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mfaChallengeToken) return

    const trimmedCode = mfaCode.trim()
    if (trimmedCode.length < 6) {
      setError(t('Please enter the complete 6-digit verification code.', 'कृपया पूरा 6-अंकीय सत्यापन कोड दर्ज करें।'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await api.auth.verifyMfa({
        username_or_email: usernameOrEmail.trim(),
        code: trimmedCode,
        mfa_challenge_token: mfaChallengeToken,
      })

      if (res.session_token) {
        setAuthToken(res.session_token)
        const loggedUsername = res.username || usernameOrEmail.trim()
        localStorage.setItem('sfs_username', loggedUsername)
        localStorage.setItem('sfs_is_admin', String(!!res.is_admin))
        if (res.last_login_at) {
          localStorage.setItem('sfs_last_login', res.last_login_at)
        }
        onLoginSuccess(loggedUsername, !!res.is_admin, res.last_login_at)
        navigate('/upload')
      } else {
        setError(t('Verification failed. Please try again.', 'सत्यापन विफल। कृपया पुनः प्रयास करें।'))
      }
    } catch (err: any) {
      setError(err.message || t('Invalid or expired 6-digit verification code.', 'अमान्य या समाप्त हो चुका 6-अंकीय सत्यापन कोड।'))
    } finally {
      setLoading(false)
    }
  }

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const digits = text.replace(/\D/g, '').slice(0, 6)
      if (digits) {
        setMfaCode(digits)
        setError(null)
        otpInputRef.current?.focus()
      }
    } catch {
      // ignore
    }
  }

  const handleResendOtp = async () => {
    if (!mfaChallengeToken || resendCooldown > 0 || resending) return
    setResending(true)
    setError(null)
    try {
      const res = await api.auth.resendMfa({
        mfa_challenge_token: mfaChallengeToken,
        username_or_email: usernameOrEmail.trim(),
      })
      if (res.mfa_challenge_token) {
        setMfaChallengeToken(res.mfa_challenge_token)
      }
      setMfaNotice(res.message || t('A new verification code has been dispatched to your email.', 'एक नया सत्यापन कोड आपके ईमेल पर भेज दिया गया है।'))
      setResendCooldown(30)
    } catch (err: any) {
      setError(err.message || t('Failed to resend code. Please try again.', 'कोड पुनः भेजने में विफल। कृपया पुनः प्रयास करें।'))
    } finally {
      setResending(false)
    }
  }

  const isFormValid = usernameOrEmail.trim().length > 0 && password.length > 0

  return (
    <div className="page-shell page-shell-narrow" style={{ padding: '1.5rem 1rem' }}>
      {/* Breadcrumb Trail */}
      <nav aria-label="Breadcrumb" style={{ fontSize: '0.82rem', color: '#606060', marginBottom: '1rem' }}>
        <Link to="/" style={{ color: '#214AAB', textDecoration: 'none' }}>{t('Home', 'होम')}</Link>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span style={{ color: '#150202', fontWeight: 600 }}>{t('Sign In', 'साइन इन')}</span>
      </nav>

      <div className="glass-card" style={{ background: '#FFFFFF', border: '1px solid #EBEAEA', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#162F6A', textAlign: 'center', margin: '0 0 0.5rem' }}>
          {mfaChallengeToken ? t('Two-Factor Authentication', 'दो-चरणीय प्रमाणीकरण') : t('Sign In to Portal', 'पोर्टल में साइन इन करें')}
        </h1>
        <p style={{ color: '#606060', fontSize: '0.88rem', textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          {mfaChallengeToken
            ? t('Enter the 6-digit one-time passcode sent to your registered official email.', 'अपने पंजीकृत आधिकारिक ईमेल पर भेजा गया 6-अंकीय ओटीपी दर्ज करें।')
            : t('Access zero-knowledge encrypted file transfers and browser cryptographic identity.', 'ज़ीरो-नॉलेज एन्क्रिप्टेड फ़ाइल ट्रांसफर और क्रिप्टोग्राफ़िक पहचान का उपयोग करें।')}
        </p>

        {/* Instructions at the starting of form */}
        <div style={{ background: '#F8FAFC', border: '1px solid #EBEAEA', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#606060', lineHeight: 1.5 }}>
          <strong>{t('Instructions:', 'निर्देश:')}</strong> {t('Please fill in all mandatory fields marked with an asterisk (*). Ensure your browser supports IndexedDB for private key storage.', 'कृपया तारांकन (*) से चिह्नित सभी अनिवार्य फ़ील्ड भरें। सुनिश्चित करें कि आपका ब्राउज़र निजी कुंजी भंडारण के लिए IndexedDB का समर्थन करता है।')}
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {mfaNotice && <div className="alert alert-info">{mfaNotice}</div>}

        {mfaChallengeToken ? (
          /* MFA Verification Form */
          <form onSubmit={handleMfaSubmit}>
            <div className="form-group" style={{ textAlign: 'center' }}>
              <label htmlFor="mfa-input" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#150202', fontSize: '0.9rem' }}>
                {t('6-Digit Verification Code', '6-अंकीय सत्यापन कोड')} <span style={{ color: '#DC3545' }}>*</span> <span style={{ fontSize: '0.75rem', color: '#606060' }}>({t('Required', 'अनिवार्य')})</span>
              </label>

              <div className="otp-input-wrap">
                <input
                  id="mfa-input"
                  ref={otpInputRef}
                  type="text"
                  required
                  autoFocus
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={mfaCode}
                  onChange={e => {
                    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setMfaCode(cleaned)
                    if (error) setError(null)
                  }}
                  className="form-control otp-input"
                  placeholder="000000"
                  style={{
                    border: '2px solid #5279D7',
                    borderRadius: '8px',
                    color: '#162F6A',
                    backgroundColor: '#FFFFFF',
                  }}
                />
              </div>

              {/* Resend & Clipboard Controls */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || resending}
                  className="btn-secondary"
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '6px',
                    cursor: resendCooldown > 0 || resending ? 'not-allowed' : 'pointer',
                  }}
                >
                  {resending
                    ? t('Resending...', 'पुनः भेजा जा रहा है...')
                    : resendCooldown > 0
                    ? `${t('Resend Code', 'कोड पुनः भेजें')} (${resendCooldown}s)`
                    : t('Resend Code', 'कोड पुनः भेजें')}
                </button>
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', borderRadius: '6px' }}
                >
                  {t('Paste from Clipboard', 'क्लिपबोर्ड से पेस्ट करें')}
                </button>
              </div>

              <span className="field-help" style={{ display: 'block', color: '#606060', fontSize: '0.8rem' }}>
                {t('Check your inbox and spam folder for the one-time passcode.', 'वन-टाइम पासकोड के लिए अपना इनबॉक्स और स्पैम फ़ोल्डर जांचें।')}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || mfaCode.length < 6}
              className="btn-primary btn-full"
              style={{
                marginTop: '1.25rem',
                backgroundColor: mfaCode.length < 6 ? '#CBD5E1' : '#214AAB',
                color: '#FFFFFF',
                cursor: mfaCode.length < 6 ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? t('Verifying...', 'सत्यापन हो रहा है...') : t('Verify Code & Sign In', 'कोड सत्यापित करें और साइन इन करें')}
            </button>

            <button
              type="button"
              className="btn-secondary btn-full"
              style={{ marginTop: '0.75rem', background: '#FFFFFF', border: '1px solid #C6C6C6' }}
              onClick={() => {
                setMfaChallengeToken(null)
                setMfaNotice(null)
                setMfaCode('')
              }}
            >
              {t('Back to Sign In', 'साइन इन पर वापस जाएं')}
            </button>
          </form>
        ) : (
          /* Login Form */
          <form onSubmit={handleLoginSubmit}>
            {/* Field 1: Username or Email */}
            <div className="form-group">
              <label htmlFor="login-username" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#150202', marginBottom: '4px' }}>
                {t('Username or Official Email', 'उपयोगकर्ता नाम या आधिकारिक ईमेल')} <span style={{ color: '#DC3545' }}>*</span> <span style={{ fontSize: '0.75rem', color: '#606060' }}>({t('Required', 'अनिवार्य')})</span>
              </label>
              <input
                id="login-username"
                type="text"
                required
                className="form-control"
                placeholder={t('e.g. student@nitk.edu.in or username', 'उदा. student@nitk.edu.in या उपयोगकर्ता नाम')}
                value={usernameOrEmail}
                onChange={e => setUsernameOrEmail(e.target.value)}
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #C6C6C6' }}
              />
              <span className="field-help" style={{ color: '#606060', fontSize: '0.78rem', marginTop: '2px' }}>
                {t('Enter your registered portal username or email address.', 'अपना पंजीकृत पोर्टल उपयोगकर्ता नाम या ईमेल पता दर्ज करें।')}
              </span>
            </div>

            {/* Field 2: Password */}
            <div className="form-group" style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label htmlFor="login-password" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#150202' }}>
                  {t('Password', 'पासवर्ड')} <span style={{ color: '#DC3545' }}>*</span> <span style={{ fontSize: '0.75rem', color: '#606060' }}>({t('Required', 'अनिवार्य')})</span>
                </label>
                <Link to="/forgot-password" className="forgot-password-link" style={{ fontSize: '0.8rem', color: '#214AAB' }}>
                  {t('Forgot Password?', 'पासवर्ड भूल गए?')}
                </Link>
              </div>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="form-control"
                  placeholder={t('Enter your secure password', 'अपना सुरक्षित पासवर्ड दर्ज करें')}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ width: '100%', paddingRight: '45px', backgroundColor: '#FFFFFF', border: '1px solid #C6C6C6' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('Hide password', 'पासवर्ड छिपाएं') : t('Show password', 'पासवर्ड दिखाएं')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#606060',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                  }}
                  title={showPassword ? t('Hide password', 'पासवर्ड छिपाएं') : t('Show password', 'पासवर्ड दिखाएं')}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <span className="field-help" style={{ color: '#606060', fontSize: '0.78rem', marginTop: '2px' }}>
                {t('Case-sensitive alphanumeric password.', 'केस-संवेदी अक्षरांकीय पासवर्ड।')}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="btn-primary btn-full"
              style={{
                marginTop: '1.5rem',
                backgroundColor: !isFormValid ? '#E2E8F0' : '#214AAB',
                color: !isFormValid ? '#64748B' : '#FFFFFF',
                border: !isFormValid ? '1px solid #CBD5E1' : '1px solid #214AAB',
                cursor: !isFormValid ? 'not-allowed' : 'pointer',
                boxShadow: !isFormValid ? 'none' : '0 3px 8px rgba(33, 74, 171, 0.25)',
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? t('Authenticating...', 'प्रमाणीकरण हो रहा है...') : t('Sign In', 'साइन इन करें')}
            </button>
          </form>
        )}

        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #EBEAEA', textAlign: 'center', fontSize: '0.85rem', color: '#606060' }}>
          {t("Don't have a registered cryptographic identity? ", 'क्या आपकी पंजीकृत क्रिप्टोग्राफ़िक पहचान नहीं है? ')}
          <Link to="/register" style={{ color: '#214AAB', fontWeight: 600, textDecoration: 'none' }}>
            {t('Register New Account', 'नया खाता पंजीकृत करें')}
          </Link>
        </div>
      </div>
    </div>
  )
}
