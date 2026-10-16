import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api/client'
import { generateLongTermKeyPair } from '../crypto/keypair'
import { storePrivateKey } from '../crypto/keystore'
import { useLanguage } from '../context/LanguageContext'

interface RegisterPageProps {
  onRegisterSuccess?: (username: string) => void
}

export const RegisterPage: React.FC<RegisterPageProps> = () => {
  const { t } = useLanguage()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [resettingDb, setResettingDb] = useState(false)

  const [strengthLabel, setStrengthLabel] = useState('Weak')
  const [strengthClass, setStrengthClass] = useState('strength-weak')

  useEffect(() => {
    if (!password) {
      setStrengthLabel('Weak')
      setStrengthClass('strength-weak')
      return
    }

    let criteria = 0
    if (password.length >= 8) criteria++
    if (/[A-Z]/.test(password)) criteria++
    if (/[a-z]/.test(password)) criteria++
    if (/[0-9]/.test(password)) criteria++
    if (/[^A-Za-z0-9]/.test(password)) criteria++

    if (criteria <= 2) {
      setStrengthLabel('Weak')
      setStrengthClass('strength-weak')
    } else if (criteria <= 4) {
      setStrengthLabel('Medium')
      setStrengthClass('strength-medium')
    } else {
      setStrengthLabel('Strong')
      setStrengthClass('strength-strong')
    }
  }, [password])

  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError(t('Passwords do not match. Please verify both password entries.', 'पासवर्ड मेल नहीं खाते। कृपया दोनों प्रविष्टियाँ जांचें।'))
      return
    }

    if (strengthLabel === 'Weak') {
      setError(t('Password is too weak. Please include at least 8 characters with a mix of uppercase, lowercase, numbers, or symbols.', 'पासवर्ड बहुत कमजोर है। कृपया कम से कम 8 वर्ण बड़े, छोटे अक्षरों, अंकों या प्रतीकों के मिश्रण के साथ शामिल करें।'))
      return
    }

    if (username.trim().toLowerCase() === 'admin' || email.trim().toLowerCase() === 'admin@example.com') {
      setError(t("The 'admin' username is reserved for the System Administrator (password: admin123456). Please sign in on the Login page.", "'admin' उपयोगकर्ता नाम सिस्टम प्रशासक के लिए आरक्षित है (पासवर्ड: admin123456)। कृपया लॉगिन पृष्ठ पर साइन इन करें।"))
      return
    }

    setLoading(true)

    try {
      // 1. Generate client-side DH long-term keypair (underlying Web Crypto algorithm unchanged)
      const keypair = await generateLongTermKeyPair()

      // 2. Store private key safely in browser IndexedDB and localStorage (never sent to server)
      await storePrivateKey(username, keypair.privateKey)
      localStorage.setItem('sfs_username', username)
      localStorage.setItem('sfs_current_private_key', keypair.privateKey)

      // 3. Register with backend
      await api.auth.register({
        username,
        email,
        password,
        long_term_public_key: keypair.publicKey,
      })

      setSuccessMsg(t('Account and cryptographic keys created successfully! Redirecting to sign in...', 'खाता और क्रिप्टोग्राफ़िक कुंजियाँ सफलतापूर्वक बनाई गईं! साइन इन पर पुनः निर्देशित किया जा रहा है...'))
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (err: any) {
      setError(err.message || t('Registration failed', 'पंजीकरण विफल'))
    } finally {
      setLoading(false)
    }
  }

  const handleQuickWipe = async () => {
    const ok = window.confirm(
      t('⚠️ Wipe all database tables and start fresh?\n\nThis will clear all registered accounts and transfers so you can register with any username immediately.',
        '⚠️ क्या सभी डेटाबेस तालिकाएँ मिटाकर नया आरंभ करना चाहते हैं?\n\nयह सभी पंजीकृत खातों और स्थानांतरणों को साफ़ कर देगा।')
    )
    if (!ok) return
    setResettingDb(true)
    setError(null)
    try {
      const res = await api.admin.emergencyReset(username.trim())
      setError(null)
      setSuccessMsg(res.message || t('Database reset successfully! You may now register.', 'डेटाबेस सफलतापूर्वक रीसेट हुआ! अब आप पंजीकरण कर सकते हैं।'))
    } catch (err: any) {
      setError(err.message || t('Failed to reset database.', 'डेटाबेस रीसेट करने में विफल।'))
    } finally {
      setResettingDb(false)
    }
  }

  const isFormValid =
    username.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    confirmPassword.length >= 8 &&
    password === confirmPassword

  const getTranslatedStrength = () => {
    if (strengthLabel === 'Weak') return t('Weak', 'कमजोर')
    if (strengthLabel === 'Medium') return t('Medium', 'मध्यम')
    return t('Strong', 'मजबूत')
  }

  return (
    <div className="page-shell page-shell-narrow" style={{ padding: '1.5rem 1rem' }}>
      {/* Breadcrumb Trail */}
      <nav aria-label="Breadcrumb" style={{ fontSize: '0.82rem', color: '#606060', marginBottom: '1rem' }}>
        <Link to="/" style={{ color: '#214AAB', textDecoration: 'none' }}>{t('Home', 'होम')}</Link>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span style={{ color: '#150202', fontWeight: 600 }}>{t('Register', 'पंजीकरण')}</span>
      </nav>

      <div className="glass-card" style={{ background: '#FFFFFF', border: '1px solid #EBEAEA', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#162F6A', textAlign: 'center', margin: '0 0 0.5rem' }}>
          {t('Create Account', 'खाता बनाएं')}
        </h1>
        <p style={{ color: '#606060', fontSize: '0.88rem', textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          {t('Generates zero-knowledge DH keys stored locally in your browser IndexedDB hardware vault.', 'स्थानीय रूप से आपके ब्राउज़र IndexedDB वॉल्ट में संग्रहीत ज़ीरो-नॉलेज DH कुंजियाँ उत्पन्न करता है।')}
        </p>

        {/* Instructions at starting of form */}
        <div style={{ background: '#F8FAFC', border: '1px solid #EBEAEA', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#606060', lineHeight: 1.5 }}>
          <strong>{t('Instructions:', 'निर्देश:')}</strong> {t('All fields marked with an asterisk (*) are mandatory. Your browser will automatically generate a DH cryptographic key pair upon submission.', 'तारांकन (*) से चिह्नित सभी फ़ील्ड अनिवार्य हैं। सबमिशन पर आपका ब्राउज़र स्वचालित रूप से एक DH क्रिप्टोग्राफ़िक कुंजी युग्म उत्पन्न करेगा।')}
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <div>{error}</div>
            {(error.toLowerCase().includes('already') ||
              error.toLowerCase().includes('taken') ||
              error.toLowerCase().includes('registered') ||
              error.toLowerCase().includes('admin')) && (
              <div
                style={{
                  marginTop: '0.65rem',
                  paddingTop: '0.6rem',
                  borderTop: '1px solid rgba(220, 53, 69, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <span style={{ fontSize: '0.82rem', color: '#842029' }}>
                  {t('Need to start fresh with a clean test database?', 'क्या स्वच्छ परीक्षण डेटाबेस के साथ पुनः आरंभ करना चाहते हैं?')}
                </span>
                <button
                  type="button"
                  className="btn-danger"
                  style={{
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.78rem',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #DC3545',
                  }}
                  onClick={handleQuickWipe}
                  disabled={resettingDb}
                >
                  {resettingDb ? t('Wiping...', 'मिटा रहा है...') : t('Reset Database', 'डेटाबेस रीसेट करें')}
                </button>
              </div>
            )}
          </div>
        )}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        {/* Registration Form */}
        <form onSubmit={handleSubmit}>
          {/* Field 1: Username */}
          <div className="form-group">
            <label htmlFor="reg-username" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#150202', marginBottom: '4px' }}>
              {t('Username', 'उपयोगकर्ता नाम')} <span style={{ color: '#DC3545' }}>*</span> <span style={{ fontSize: '0.75rem', color: '#606060' }}>({t('Required', 'अनिवार्य')})</span>
            </label>
            <input
              id="reg-username"
              type="text"
              required
              className="form-control"
              placeholder={t('e.g. rahul_sharma', 'उदा. rahul_sharma')}
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #C6C6C6' }}
            />
            <span className="field-help" style={{ color: '#606060', fontSize: '0.78rem', marginTop: '2px' }}>
              {t('Unique alphanumeric portal username.', 'अद्वितीय अक्षरांकीय पोर्टल उपयोगकर्ता नाम।')}
            </span>
          </div>

          {/* Field 2: Email */}
          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label htmlFor="reg-email" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#150202', marginBottom: '4px' }}>
              {t('Email Address', 'ईमेल पता')} <span style={{ color: '#DC3545' }}>*</span> <span style={{ fontSize: '0.75rem', color: '#606060' }}>({t('Required', 'अनिवार्य')})</span>
            </label>
            <input
              id="reg-email"
              type="email"
              required
              className="form-control"
              placeholder={t('student@nitk.edu.in or name@example.com', 'student@nitk.edu.in या name@example.com')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #C6C6C6' }}
            />
            <span className="field-help" style={{ color: '#606060', fontSize: '0.78rem', marginTop: '2px' }}>
              {t('Two-factor authentication (2FA) verification codes will be sent to this email upon login.', 'लॉगिन करने पर इस ईमेल पर 2FA सत्यापन कोड भेजा जाएगा।')}
            </span>
          </div>

          {/* Field 3: Password */}
          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label htmlFor="reg-password" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#150202', marginBottom: '4px' }}>
              {t('Password', 'पासवर्ड')} <span style={{ color: '#DC3545' }}>*</span> <span style={{ fontSize: '0.75rem', color: '#606060' }}>({t('Required', 'अनिवार्य')})</span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                className="form-control"
                placeholder={t('Minimum 8 characters', 'न्यूनतम 8 वर्ण')}
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
                  padding: '4px',
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {password && (
              <div className={`password-strength-container ${strengthClass}`} style={{ marginTop: '4px' }}>
                <div className="password-strength-bar">
                  <div className="password-strength-fill"></div>
                </div>
                <div className="password-strength-label" style={{ fontSize: '0.78rem' }}>
                  {t('Strength:', 'सामर्थ्य:')} {getTranslatedStrength()}
                </div>
              </div>
            )}
            <span className="field-help" style={{ color: '#606060', fontSize: '0.78rem', marginTop: '2px' }}>
              {t('Must contain at least 8 characters with upper, lower, numbers, or symbols.', 'कम से कम 8 वर्ण बड़े, छोटे, अंक या प्रतीकों के साथ होने चाहिए।')}
            </span>
          </div>

          {/* Field 4: Confirm Password */}
          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label htmlFor="reg-confirm-password" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#150202', marginBottom: '4px' }}>
              {t('Confirm Password', 'पासवर्ड की पुष्टि करें')} <span style={{ color: '#DC3545' }}>*</span> <span style={{ fontSize: '0.75rem', color: '#606060' }}>({t('Required', 'अनिवार्य')})</span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="reg-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={8}
                className="form-control"
                placeholder={t('Re-enter password', 'पासवर्ड पुनः दर्ज करें')}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ width: '100%', paddingRight: '45px', backgroundColor: '#FFFFFF', border: '1px solid #C6C6C6' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? t('Hide password', 'पासवर्ड छिपाएं') : t('Show password', 'पासवर्ड दिखाएं')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#606060',
                  padding: '4px',
                }}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <span style={{ color: '#DC3545', fontSize: '0.78rem', display: 'block', marginTop: '2px' }}>
                {t('Passwords do not match.', 'पासवर्ड मेल नहीं खाते।')}
              </span>
            )}
            {confirmPassword && password === confirmPassword && (
              <span style={{ color: '#198754', fontSize: '0.78rem', display: 'block', marginTop: '2px' }}>
                {t('✓ Passwords match.', '✓ पासवर्ड मेल खाते हैं।')}
              </span>
            )}
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
            {loading ? t('Generating DH Keys...', 'DH कुंजियाँ उत्पन्न हो रही हैं...') : t('Register Account', 'खाता पंजीकृत करें')}
          </button>
        </form>

        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #EBEAEA', textAlign: 'center', fontSize: '0.85rem', color: '#606060' }}>
          {t('Already have an account? ', 'क्या आपके पास पहले से खाता है? ')}
          <Link to="/login" style={{ color: '#214AAB', fontWeight: 600, textDecoration: 'none' }}>
            {t('Sign In Directly', 'सीधे साइन इन करें')}
          </Link>
        </div>
      </div>
    </div>
  )
}
