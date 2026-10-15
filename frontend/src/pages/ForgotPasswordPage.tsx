import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useLanguage } from '../context/LanguageContext'

export const ForgotPasswordPage: React.FC = () => {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setError('')
    setMessage('')
    setLoading(true)

    try {
      await api.auth.forgotPassword({ email: email.trim() })
      setMessage(t('If an account exists with this email, a password reset link has been sent.', 'यदि इस ईमेल के साथ कोई खाता मौजूद है, तो पासवर्ड रीसेट लिंक भेज दिया गया है।'))
    } catch (err: any) {
      setError(err.message || t('Failed to request password reset.', 'पासवर्ड रीसेट अनुरोध विफल रहा।'))
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = email.trim().length > 0

  return (
    <div className="page-shell page-shell-narrow" style={{ padding: '1.5rem 1rem' }}>
      {/* Breadcrumb Trail */}
      <nav aria-label="Breadcrumb" style={{ fontSize: '0.82rem', color: '#606060', marginBottom: '1rem' }}>
        <Link to="/" style={{ color: '#214AAB', textDecoration: 'none' }}>{t('Home', 'होम')}</Link>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <Link to="/login" style={{ color: '#214AAB', textDecoration: 'none' }}>{t('Sign In', 'साइन इन')}</Link>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span style={{ color: '#150202', fontWeight: 600 }}>{t('Forgot Password', 'पासवर्ड भूल गए')}</span>
      </nav>

      <div className="glass-card" style={{ background: '#FFFFFF', border: '1px solid #EBEAEA', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#162F6A', textAlign: 'center', margin: '0 0 0.5rem' }}>
          {t('Reset Password Request', 'पासवर्ड रीसेट अनुरोध')}
        </h1>
        <p style={{ color: '#606060', fontSize: '0.88rem', textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          {t('Enter your registered portal email address to receive password recovery instructions.', 'पासवर्ड पुनर्प्राप्ति निर्देश प्राप्त करने के लिए अपना पंजीकृत पोर्टल ईमेल पता दर्ज करें।')}
        </p>

        {/* Instructions at starting of form */}
        <div style={{ background: '#F8FAFC', border: '1px solid #EBEAEA', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#606060', lineHeight: 1.5 }}>
          <strong>{t('Instructions:', 'निर्देश:')}</strong> {t('Please provide your registered email address. Fields marked with an asterisk (*) are mandatory.', 'कृपया अपना पंजीकृत ईमेल पता प्रदान करें। तारांकन (*) से चिह्नित फ़ील्ड अनिवार्य हैं।')}
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="forgot-email" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#150202', marginBottom: '4px', display: 'block' }}>
              {t('Registered Email Address', 'पंजीकृत ईमेल पता')} <span style={{ color: '#DC3545' }}>*</span> <span style={{ fontSize: '0.75rem', color: '#606060' }}>({t('Required', 'अनिवार्य')})</span>
            </label>
            <input
              type="email"
              id="forgot-email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder={t('student@nitk.edu.in or name@example.com', 'student@nitk.edu.in या name@example.com')}
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #C6C6C6' }}
            />
            <span className="field-help" style={{ color: '#606060', fontSize: '0.78rem', marginTop: '2px', display: 'block' }}>
              {t('A secure password reset link will be dispatched to this address.', 'इस पते पर एक सुरक्षित पासवर्ड रीसेट लिंक भेजा जाएगा।')}
            </span>
          </div>

          <button
            type="submit"
            className="btn-primary btn-full"
            disabled={loading || !isFormValid}
            style={{
              marginTop: '1.5rem',
              backgroundColor: !isFormValid ? '#E2E8F0' : '#214AAB',
              color: !isFormValid ? '#64748B' : '#FFFFFF',
              border: !isFormValid ? '1px solid #CBD5E1' : '1px solid #214AAB',
              cursor: !isFormValid ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? t('Sending Request...', 'अनुरोध भेजा जा रहा है...') : t('Send Reset Link', 'रीसेट लिंक भेजें')}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link to="/login" style={{ color: '#214AAB', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>
            &larr; {t('Return to Sign In', 'साइन इन पर वापस जाएं')}
          </Link>
        </div>
      </div>
    </div>
  )
}
