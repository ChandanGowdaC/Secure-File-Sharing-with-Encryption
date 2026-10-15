import React, { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useLanguage } from '../context/LanguageContext'

export const ResetPasswordPage: React.FC = () => {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [strengthLabel, setStrengthLabel] = useState('Weak')
  const [strengthClass, setStrengthClass] = useState('strength-weak')

  useEffect(() => {
    if (!newPassword) {
      setStrengthLabel('Weak')
      setStrengthClass('strength-weak')
      return
    }

    let criteria = 0
    if (newPassword.length >= 8) criteria++
    if (/[A-Z]/.test(newPassword)) criteria++
    if (/[a-z]/.test(newPassword)) criteria++
    if (/[0-9]/.test(newPassword)) criteria++
    if (/[^A-Za-z0-9]/.test(newPassword)) criteria++

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
  }, [newPassword])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!token) {
      setError(t('Invalid or missing password reset token.', 'अमान्य या अनुपलब्ध पासवर्ड रीसेट टोकन।'))
      return
    }

    if (newPassword !== confirmPassword) {
      setError(t('Passwords do not match. Please verify both entries.', 'पासवर्ड मेल नहीं खाते। कृपया दोनों प्रविष्टियाँ जांचें।'))
      return
    }

    if (strengthLabel === 'Weak') {
      setError(t('Password is too weak. Please use at least 8 characters with upper, lower, numbers, or symbols.', 'पासवर्ड बहुत कमजोर है। कृपया कम से कम 8 वर्ण बड़े, छोटे, अंक या प्रतीकों के साथ प्रयोग करें।'))
      return
    }

    setLoading(true)

    try {
      await api.auth.resetPassword({ token, new_password: newPassword })
      setMessage(t('Password successfully reset! Redirecting to sign in...', 'पासवर्ड सफलतापूर्वक रीसेट हो गया! साइन इन पर पुनः निर्देशित किया जा रहा है...'))
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: any) {
      setError(err.message || t('Failed to reset password.', 'पासवर्ड रीसेट करने में विफल।'))
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = newPassword.length >= 8 && confirmPassword.length >= 8 && newPassword === confirmPassword

  const getTranslatedStrength = () => {
    if (strengthLabel === 'Weak') return t('Weak', 'कमजोर')
    if (strengthLabel === 'Medium') return t('Medium', 'मध्यम')
    return t('Strong', 'मजबूत')
  }

  if (!token) {
    return (
      <div className="page-shell page-shell-narrow" style={{ padding: '1.5rem 1rem' }}>
        <div className="glass-card text-center" style={{ background: '#FFFFFF', border: '1px solid #EBEAEA', borderRadius: '12px', padding: '2rem' }}>
          <h2 style={{ color: '#DC3545', margin: '0 0 1rem' }}>{t('Invalid Reset Link', 'अमान्य रीसेट लिंक')}</h2>
          <p style={{ color: '#606060', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {t('The password reset link is invalid or has expired. Please request a new link.', 'पासवर्ड रीसेट लिंक अमान्य है या समाप्त हो चुका है। कृपया एक नया लिंक अनुरोध करें।')}
          </p>
          <Link to="/login" className="btn-primary" style={{ backgroundColor: '#214AAB' }}>
            {t('Back to Sign In', 'साइन इन पर वापस जाएं')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell page-shell-narrow" style={{ padding: '1.5rem 1rem' }}>
      {/* Breadcrumb Trail */}
      <nav aria-label="Breadcrumb" style={{ fontSize: '0.82rem', color: '#606060', marginBottom: '1rem' }}>
        <Link to="/" style={{ color: '#214AAB', textDecoration: 'none' }}>{t('Home', 'होम')}</Link>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span style={{ color: '#150202', fontWeight: 600 }}>{t('Reset Password', 'पासवर्ड रीसेट करें')}</span>
      </nav>

      <div className="glass-card" style={{ background: '#FFFFFF', border: '1px solid #EBEAEA', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#162F6A', textAlign: 'center', margin: '0 0 0.5rem' }}>
          {t('Set New Password', 'नया पासवर्ड सेट करें')}
        </h1>
        <p style={{ color: '#606060', fontSize: '0.88rem', textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          {t('Create a new secure password for your portal account.', 'अपने पोर्टल खाते के लिए एक नया सुरक्षित पासवर्ड बनाएं।')}
        </p>

        {/* Instructions at starting of form */}
        <div style={{ background: '#F8FAFC', border: '1px solid #EBEAEA', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#606060', lineHeight: 1.5 }}>
          <strong>{t('Instructions:', 'निर्देश:')}</strong> {t('Fields marked with an asterisk (*) are mandatory. The new password must be at least 8 characters long.', 'तारांकन (*) से चिह्नित फ़ील्ड अनिवार्य हैं। नया पासवर्ड कम से कम 8 वर्ण लंबा होना चाहिए।')}
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="newPassword" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#150202', marginBottom: '4px', display: 'block' }}>
              {t('New Password', 'नया पासवर्ड')} <span style={{ color: '#DC3545' }}>*</span> <span style={{ fontSize: '0.75rem', color: '#606060' }}>({t('Required', 'अनिवार्य')})</span>
            </label>
            <input
              type="password"
              id="newPassword"
              className="form-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
              placeholder={t('Enter new password', 'नया पासवर्ड दर्ज करें')}
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #C6C6C6' }}
            />
            {newPassword && (
              <div className={`password-strength-container ${strengthClass}`} style={{ marginTop: '4px' }}>
                <div className="password-strength-bar">
                  <div className="password-strength-fill"></div>
                </div>
                <div className="password-strength-label" style={{ fontSize: '0.78rem' }}>
                  {t('Strength:', 'सामर्थ्य:')} {getTranslatedStrength()}
                </div>
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="confirmPassword" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#150202', marginBottom: '4px', display: 'block' }}>
              {t('Confirm Password', 'पासवर्ड की पुष्टि करें')} <span style={{ color: '#DC3545' }}>*</span> <span style={{ fontSize: '0.75rem', color: '#606060' }}>({t('Required', 'अनिवार्य')})</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              placeholder={t('Re-enter new password', 'नया पासवर्ड पुनः दर्ज करें')}
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #C6C6C6' }}
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <span style={{ color: '#DC3545', fontSize: '0.78rem', display: 'block', marginTop: '2px' }}>
                {t('Passwords do not match.', 'पासवर्ड मेल नहीं खाते।')}
              </span>
            )}
            {confirmPassword && newPassword === confirmPassword && (
              <span style={{ color: '#198754', fontSize: '0.78rem', display: 'block', marginTop: '2px' }}>
                {t('✓ Passwords match.', '✓ पासवर्ड मेल खाते हैं।')}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary btn-full"
            disabled={loading || !isFormValid}
            style={{
              marginTop: '0.5rem',
              backgroundColor: !isFormValid ? '#E2E8F0' : '#214AAB',
              color: !isFormValid ? '#64748B' : '#FFFFFF',
              border: !isFormValid ? '1px solid #CBD5E1' : '1px solid #214AAB',
              cursor: !isFormValid ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? t('Resetting Password...', 'पासवर्ड रीसेट हो रहा है...') : t('Reset Password', 'पासवर्ड रीसेट करें')}
          </button>
        </form>
      </div>
    </div>
  )
}
