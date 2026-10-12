import React, { useState, useEffect } from 'react'

const COOKIE_CONSENT_KEY = 'gov_dbim_cookie_consent'

interface CookiePreferences {
  essential: boolean // strictly required
  functionality: boolean
  analytics: boolean
}

export const CookieBanner: React.FC = () => {
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
      {/* Cookie Consent Banner - Bottom of Page (DBIM Section 7.6.1.ii, Figure 40, Page 61) */}
      {isVisible && (
        <div
          role="region"
          aria-label="Cookie Consent Banner"
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
              This website uses cookies to provide a better user experience. By clicking accept, you agree to the policies outlined in the{' '}
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
                Cookie Settings
              </button>
              {' '}in compliance with the Digital Personal Data Protection Act, 2023.
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
              CUSTOMIZE COOKIES
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
              ACCEPT ESSENTIAL COOKIES
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
              ACCEPT ALL COOKIES
            </button>
          </div>
        </div>
      )}

      {/* Cookie Settings Modal (DBIM Figure 41, Page 63) */}
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
                Cookie Setting
              </h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                aria-label="Close Cookie Settings"
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
              Welcome to the Cookie Settings page, where you have the power to tailor your browsing experience. Here you will find detailed information about the cookies we use, categorized as &apos;Essential&apos; and &apos;Optional&apos;. Make informed choices that align with your privacy preferences under the Digital Personal Data Protection (DPDP) Act, 2023.
            </p>

            {/* Essential Cookies (Section 7.6.3.1, Page 61) */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #EBEAEA' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#150202', marginBottom: '0.5rem' }}>
                ESSENTIAL COOKIES
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#150202' }}>Session Cookies</strong>
                  <p style={{ fontSize: '0.8rem', color: '#606060', margin: '2px 0 0' }}>
                    Enables user session persistence, allowing seamless navigation on the website. Automatically removed when logging out.
                  </p>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#198754', padding: '2px 8px', background: '#E6F4EA', borderRadius: '4px' }}>
                  ALWAYS ACTIVE
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#150202' }}>Persistent Preference Cookies</strong>
                  <p style={{ fontSize: '0.8rem', color: '#606060', margin: '2px 0 0' }}>
                    Remembers user preferences like language, accessibility settings, and cryptographic identity keys in browser vault.
                  </p>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#198754', padding: '2px 8px', background: '#E6F4EA', borderRadius: '4px' }}>
                  ALWAYS ACTIVE
                </span>
              </div>
            </div>

            {/* Optional Cookies (Section 7.6.3.2, Page 62) */}
            <div style={{ marginBottom: '1.75rem', padding: '1rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #EBEAEA' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#150202', marginBottom: '0.5rem' }}>
                OPTIONAL COOKIES
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#150202' }}>Preference / Functionality Cookies</strong>
                  <p style={{ fontSize: '0.8rem', color: '#606060', margin: '2px 0 0' }}>
                    Remembers search history, recent transfers, and recipient shortcuts.
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
                  <strong style={{ fontSize: '0.85rem', color: '#150202' }}>Analytics & Monitoring Cookies</strong>
                  <p style={{ fontSize: '0.8rem', color: '#606060', margin: '2px 0 0' }}>
                    Anonymous metrics to improve user interface responsiveness and page loading speeds.
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
                Cancel
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
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
