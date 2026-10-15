import React, { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'

const COOKIE_CONSENT_KEY = 'sfs_cookie_consent'

interface CookiePreferences {
  essential: boolean // strictly required
  functionality: boolean
  analytics: boolean
}

export const CookieBanner: React.FC = () => {
  const { t } = useLanguage()
  const [isVisible, setIsVisible] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    functionality: true,
    analytics: false,
  })

  useEffect(() => {
    const saved = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!saved) {
      setIsVisible(true)
    } else {
      try {
        setPreferences(JSON.parse(saved))
      } catch {
        // ignore
      }
    }
  }, [])

  const savePreferences = (pref: CookiePreferences) => {
    setPreferences(pref)
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(pref))
    setIsVisible(false)
    setIsSettingsOpen(false)
  }

  const handleAcceptAll = () => {
    savePreferences({
      essential: true,
      functionality: true,
      analytics: true,
    })
  }

  const handleAcceptEssential = () => {
    savePreferences({
      essential: true,
      functionality: false,
      analytics: false,
    })
  }

  return (
    <>
      {/* Cookie Consent Banner - Bottom of Page */}
      {isVisible && (
        <div
          role="region"
          aria-label={t('Cookie Consent Banner', 'कुकी सहमति बैनर')}
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            borderTop: '2px solid #EBEAEA',
            boxShadow: '0 -4px 16px rgba(21, 2, 2, 0.08)',
            padding: '1.25rem 2rem',
            zIndex: 9999,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            fontFamily: "'Noto Sans', sans-serif",
          }}
        >
          <div style={{ flex: '1 1 500px' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#150202', lineHeight: 1.5 }}>
              {t(
                'This website uses cookies to provide a better user experience. By clicking accept, you agree to the policies outlined in the ',
                'यह वेबसाइट बेहतर उपयोगकर्ता अनुभव प्रदान करने के लिए कुकीज़ का उपयोग करती है। स्वीकार पर क्लिक करके, आप नीतियों से सहमत होते हैं '
              )}
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0D6EFD',
                  textDecoration: 'underline',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                }}
              >
                {t('Cookie Settings', 'कुकी सेटिंग्स')}
              </button>
              {t(
                ' in compliance with data privacy standards.',
                ' डेटा गोपनीयता मानकों के अनुपालन में।'
              )}
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            {/* Customize Cookies */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#150202',
                border: '1px solid #C6C6C6',
                borderRadius: '6px',
                padding: '0.6rem 1.1rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '0.02em',
                transition: 'all 0.2s ease',
              }}
            >
              {t('CUSTOMIZE COOKIES', 'कुकीज़ अनुकूलित करें')}
            </button>

            {/* Accept Essential Cookies */}
            <button
              type="button"
              onClick={handleAcceptEssential}
              style={{
                backgroundColor: '#D2DFFF',
                color: '#162F6A',
                border: '1px solid #A3BBF3',
                borderRadius: '6px',
                padding: '0.6rem 1.1rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '0.02em',
                transition: 'all 0.2s ease',
              }}
            >
              {t('ACCEPT ESSENTIAL COOKIES', 'आवश्यक कुकीज़ स्वीकार करें')}
            </button>

            {/* Accept All Cookies */}
            <button
              type="button"
              onClick={handleAcceptAll}
              style={{
                backgroundColor: '#214AAB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                padding: '0.6rem 1.25rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '0.02em',
                boxShadow: '0 2px 6px rgba(33, 74, 171, 0.25)',
                transition: 'all 0.2s ease',
              }}
            >
              {t('ACCEPT ALL COOKIES', 'सभी कुकीज़ स्वीकार करें')}
            </button>
          </div>
        </div>
      )}

      {/* Cookie Settings Modal */}
      {isSettingsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-settings-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(21, 2, 2, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
            padding: '1rem',
          }}
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '2px solid #EBEAEA',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '620px',
              padding: '2rem',
              boxShadow: '0 12px 32px rgba(21, 2, 2, 0.15)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 id="cookie-settings-title" style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: '#150202' }}>
                {t('Cookie Settings', 'कुकी सेटिंग्स')}
              </h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                aria-label={t('Close Cookie Settings', 'कुकी सेटिंग्स बंद करें')}
                style={{
                  background: '#EBEAEA',
                  border: 'none',
                  borderRadius: '6px',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  color: '#150202',
                  fontWeight: 600,
                }}
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#606060', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {t(
                "Welcome to the Cookie Settings page. Here you will find detailed information about the cookies we use, categorized as 'Essential' and 'Optional'. Make choices that align with your privacy preferences.",
                'कुकी सेटिंग्स पृष्ठ पर आपका स्वागत है। यहाँ आपको हमारे द्वारा उपयोग की जाने वाली कुकीज़ के बारे में विस्तृत जानकारी मिलेगी, जिन्हें आवश्यक और वैकल्पिक के रूप में वर्गीकृत किया गया है।'
              )}
            </p>

            {/* Essential Cookies */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #EBEAEA' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#150202', marginBottom: '0.5rem' }}>
                {t('ESSENTIAL COOKIES', 'आवश्यक कुकीज़')}
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#150202' }}>{t('Session Cookies', 'सत्र कुकीज़')}</strong>
                  <p style={{ fontSize: '0.8rem', color: '#606060', margin: '2px 0 0' }}>
                    {t(
                      'Enables user session persistence, allowing seamless navigation on the website. Automatically removed when logging out.',
                      'उपयोगकर्ता सत्र बनाए रखता है, जिससे वेबसाइट पर नेविगेशन सक्षम होता है। लॉग आउट करने पर स्वचालित रूप से हटा दिया जाता है।'
                    )}
                  </p>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#198754', padding: '2px 8px', background: '#E6F4EA', borderRadius: '4px' }}>
                  {t('ALWAYS ACTIVE', 'सदैव सक्रिय')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#150202' }}>{t('Persistent Preference Cookies', 'प्राथमिकता कुकीज़')}</strong>
                  <p style={{ fontSize: '0.8rem', color: '#606060', margin: '2px 0 0' }}>
                    {t(
                      'Remembers user preferences like language, accessibility settings, and cryptographic identity keys in browser vault.',
                      'ब्राउज़र वॉल्ट में भाषा, अभिगम्यता सेटिंग्स और क्रिप्टोग्राफ़िक पहचान कुंजियों जैसी उपयोगकर्ता प्राथमिकताओं को याद रखता है।'
                    )}
                  </p>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#198754', padding: '2px 8px', background: '#E6F4EA', borderRadius: '4px' }}>
                  {t('ALWAYS ACTIVE', 'सदैव सक्रिय')}
                </span>
              </div>
            </div>

            {/* Optional Cookies */}
            <div style={{ marginBottom: '1.75rem', padding: '1rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #EBEAEA' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#150202', marginBottom: '0.5rem' }}>
                {t('OPTIONAL COOKIES', 'वैकल्पिक कुकीज़')}
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#150202' }}>{t('Preference / Functionality Cookies', 'प्राथमिकता / कार्यक्षमता कुकीज़')}</strong>
                  <p style={{ fontSize: '0.8rem', color: '#606060', margin: '2px 0 0' }}>
                    {t(
                      'Remembers search history, recent transfers, and recipient shortcuts.',
                      'खोज इतिहास, हालिया स्थानांतरण और प्राप्तकर्ता शॉर्टकट याद रखता है।'
                    )}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.functionality}
                  onChange={(e) => setPreferences((p) => ({ ...p, functionality: e.target.checked }))}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#150202' }}>{t('Analytics & Monitoring Cookies', 'एनालिटिक्स एवं मॉनिटरिंग कुकीज़')}</strong>
                  <p style={{ fontSize: '0.8rem', color: '#606060', margin: '2px 0 0' }}>
                    {t(
                      'Anonymous metrics to improve user interface responsiveness and page loading speeds.',
                      'यूज़र इंटरफ़ेस प्रतिक्रिया और पेज लोडिंग गति में सुधार के लिए अनाम मेट्रिक्स।'
                    )}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences((p) => ({ ...p, analytics: e.target.checked }))}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '6px',
                  border: '1px solid #C6C6C6',
                  background: '#EBEAEA',
                  color: '#150202',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                {t('Cancel', 'रद्द करें')}
              </button>
              <button
                type="button"
                onClick={() => savePreferences(preferences)}
                style={{
                  padding: '0.65rem 1.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#214AAB',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                {t('Save Preferences', 'प्राथमिकताएं सहेजें')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
