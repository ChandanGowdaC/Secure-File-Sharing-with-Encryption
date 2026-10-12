import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ProjectEmblem } from './BrandLogos'
import { IconSearch, IconVoice, IconAccessibility } from './LineIcons'
import { AccessibilityModal } from './AccessibilityControls'
import { SearchModal } from './SearchModal'

interface HeaderProps {
  user: string | null
  isAdmin: boolean
  lastLogin: string | null
  unreadCount: number
  onLogout: () => void
  onDeleteAccount: () => void
  currentLanguage: 'en' | 'hi'
  onToggleLanguage: () => void
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isAdmin,
  lastLogin,
  unreadCount,
  onLogout,
  onDeleteAccount,
  currentLanguage,
  onToggleLanguage,
}) => {
  const [isA11yOpen, setIsA11yOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [navSearchInput, setNavSearchInput] = useState('')
  const location = useLocation()

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearchOpen(true)
  }

  const isHindi = currentLanguage === 'hi'

  return (
    <>
      <header
        role="banner"
        style={{
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #EBEAEA',
          fontFamily: "'Noto Sans', sans-serif",
        }}
      >
        {/* Tricolor Identity Accent Strip (3px) */}
        <div
          style={{
            height: '3.5px',
            width: '100%',
            background: 'linear-gradient(90deg, #FF9933 0%, #FF9933 33.3%, #FFFFFF 33.3%, #FFFFFF 66.6%, #138808 66.6%, #138808 100%)',
          }}
        />

        {/* 1. Top Accessibility & Language Strip (DBIM Section 5.4 Fixed Engagement Bar & Section 7.5.1 i) */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #EBEAEA',
            padding: '0.35rem 1.5rem',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            color: '#150202',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <span style={{ fontWeight: 600, color: '#162F6A' }}>
              {isHindi
                ? 'आईटी303 सॉफ्टवेयर इंजीनियरिंग कोर्स प्रोजेक्ट | एनआईटीके सुरथकल'
                : 'IT303 Software Engineering Course Project | NITK Surathkal'}
            </span>
            {/* Skip to Main Content (WCAG 2.1 / GIGW 3.0 / DBIM Section 5.4) */}
            <a
              href="#main-content"
              style={{
                color: '#214AAB',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.78rem',
                padding: '2px 6px',
                borderRadius: '4px',
                background: '#EEF2FF',
              }}
              className="skip-link"
            >
              {isHindi ? 'मुख्य सामग्री पर जाएं' : 'Skip to main content'}
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Language Switcher with universally recognized "अ | A" icon (DBIM Section 7.5.1 i) */}
            <button
              type="button"
              onClick={onToggleLanguage}
              aria-label="Toggle language between English and Hindi"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#FFFFFF',
                border: '1px solid #C6C6C6',
                borderRadius: '4px',
                padding: '0.2rem 0.6rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#150202',
                cursor: 'pointer',
              }}
              title="Change Language / भाषा बदलें"
            >
              <span style={{ fontWeight: 700, color: '#162F6A' }}>अ | A</span>
              <span>{isHindi ? 'English' : 'हिन्दी'}</span>
            </button>

            {/* Accessibility Controls Button (DBIM Section 8, Figure 44) */}
            <button
              type="button"
              onClick={() => setIsA11yOpen(true)}
              aria-label="Open Accessibility Controls"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#FFFFFF',
                border: '1px solid #C6C6C6',
                borderRadius: '4px',
                padding: '0.2rem 0.6rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#150202',
                cursor: 'pointer',
              }}
              title="Accessibility Options"
            >
              <IconAccessibility size={20} color="#214AAB" />
              <span>{isHindi ? 'सुगम्यता (Accessibility)' : 'Accessibility'}</span>
            </button>
          </div>
        </div>

        {/* 2. Main Header Bar: Project Lockup + Search Bar + Standards Badge + User Controls */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Project Brand Lockup */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.9rem',
              textDecoration: 'none',
              color: '#150202',
            }}
          >
            <ProjectEmblem size={48} color="#162F6A" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#214AAB', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {isHindi ? 'ज़ीरो-नॉलेज एन्क्रिप्शन पोर्टल' : 'Zero-Knowledge Encrypted Portal'}
              </span>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#162F6A', lineHeight: 1.25 }}>
                {isHindi ? 'सुरक्षित फ़ाइल साझाकरण' : 'Secure File Sharing'}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#606060' }}>
                {isHindi
                  ? 'मार्गदर्शन: डॉ. जैधर सी डी | प्रभाव पी (241IT053), सुचेत के कट्टे (241IT078), चंदन गौड़ा सी (241IT016)'
                  : 'Guided by Dr. Jaidhar C D | Prabhav P (241IT053), Sucheth K Katte (241IT078), Chandan Gowda C (241IT016)'}
              </span>
            </div>
          </Link>

          {/* Search Box of Sufficient Length in Header (DBIM Section 9.v) */}
          <form
            onSubmit={handleSearchSubmit}
            style={{
              flex: '1 1 300px',
              maxWidth: '440px',
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            <input
              type="search"
              value={navSearchInput}
              onChange={(e) => setNavSearchInput(e.target.value)}
              placeholder={isHindi ? 'सुविधाएं, मैनुअल, एन्क्रिप्शन खोजें...' : 'Search features, encryption, user manual...'}
              style={{
                width: '100%',
                padding: '0.55rem 4.5rem 0.55rem 0.95rem',
                borderRadius: '6px',
                border: '1px solid #C6C6C6',
                fontSize: '0.88rem',
                color: '#150202',
                backgroundColor: '#FFFFFF',
                outline: 'none',
              }}
              onFocus={() => setIsSearchOpen(true)}
            />
            <div style={{ position: 'absolute', right: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                title="Voice Search (Simulated)"
                aria-label="Voice Search"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#606060',
                  padding: '3px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <IconVoice size={22} color="#606060" />
              </button>
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                title="Search"
                aria-label="Submit Search"
                style={{
                  background: '#214AAB',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#FFFFFF',
                  padding: '5px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <IconSearch size={22} color="#FFFFFF" />
              </button>
            </div>
          </form>


          {/* User Controls: Login / Register or Profile Display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '0.3rem 0.7rem',
                    background: '#F8FAFC',
                    borderRadius: '6px',
                    border: '1px solid #EBEAEA',
                    lineHeight: 1.25,
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#162F6A', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    👤 {user}
                    {isAdmin && (
                      <span style={{ fontSize: '0.65rem', background: '#D2DFFF', color: '#162F6A', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                        ADMIN
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#606060' }}>
                    {lastLogin
                      ? `Last: ${new Date(lastLogin).toLocaleDateString('en-GB')} ${new Date(lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : 'Active Now'}
                  </span>
                </div>

                <button
                  onClick={onLogout}
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#150202',
                    border: '1px solid #C6C6C6',
                    borderRadius: '6px',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isHindi ? 'लॉग आउट' : 'Logout'}
                </button>
                {!isAdmin && (
                  <button
                    onClick={onDeleteAccount}
                    style={{
                      backgroundColor: '#FFFFFF',
                      color: '#DC3545',
                      border: '1px solid #DC3545',
                      borderRadius: '6px',
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    title="Permanently delete your account"
                  >
                    {isHindi ? 'खाता हटाएं' : 'Delete Account'}
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link
                  to="/login"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#162F6A',
                    border: '1px solid #C6C6C6',
                    borderRadius: '6px',
                    padding: '0.45rem 1rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  {isHindi ? 'साइन इन' : 'Sign In'}
                </Link>
                <Link
                  to="/register"
                  style={{
                    backgroundColor: '#214AAB',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.45rem 1.1rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    boxShadow: '0 2px 6px rgba(33, 74, 171, 0.2)',
                  }}
                >
                  {isHindi ? 'पंजीकरण' : 'Register'}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 3. Global Navigation Menu (Sticky, Clean & Non-Redundant) */}
        <nav
          role="navigation"
          aria-label="Global Navigation"
          style={{
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #EBEAEA',
            borderBottom: '2px solid #D2DFFF',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            padding: '0 1.5rem',
            overflowX: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', minWidth: 'max-content' }}>
            {/* Home */}
            <Link
              to="/"
              style={{
                padding: '0.75rem 1.1rem',
                color: location.pathname === '/' ? '#214AAB' : '#150202',
                fontWeight: location.pathname === '/' ? 700 : 600,
                fontSize: '0.88rem',
                textDecoration: 'none',
                borderBottom: location.pathname === '/' ? '3px solid #214AAB' : '3px solid transparent',
              }}
            >
              {isHindi ? 'होम' : 'Home'}
            </Link>

            {/* Send File (Upload) */}
            <Link
              to="/upload"
              style={{
                padding: '0.75rem 1.1rem',
                color: location.pathname === '/upload' ? '#214AAB' : '#150202',
                fontWeight: location.pathname === '/upload' ? 700 : 600,
                fontSize: '0.88rem',
                textDecoration: 'none',
                borderBottom: location.pathname === '/upload' ? '3px solid #214AAB' : '3px solid transparent',
              }}
            >
              {isHindi ? 'फ़ाइल भेजें (अपलोड)' : 'Send File (Upload)'}
            </Link>

            {/* Recipient Inbox */}
            <Link
              to="/inbox"
              style={{
                padding: '0.75rem 1.1rem',
                color: location.pathname === '/inbox' ? '#214AAB' : '#150202',
                fontWeight: location.pathname === '/inbox' ? 700 : 600,
                fontSize: '0.88rem',
                textDecoration: 'none',
                borderBottom: location.pathname === '/inbox' ? '3px solid #214AAB' : '3px solid transparent',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{isHindi ? 'प्राप्तकर्ता इनबॉक्स' : 'Recipient Inbox'}</span>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: '#DC3545',
                    color: '#FFFFFF',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Change Password (When authenticated) */}
            {user && (
              <Link
                to="/change-password"
                style={{
                  padding: '0.75rem 1.1rem',
                  color: location.pathname === '/change-password' ? '#214AAB' : '#150202',
                  fontWeight: location.pathname === '/change-password' ? 700 : 600,
                  fontSize: '0.88rem',
                  textDecoration: 'none',
                  borderBottom: location.pathname === '/change-password' ? '3px solid #214AAB' : '3px solid transparent',
                }}
              >
                {isHindi ? 'पासवर्ड बदलें' : 'Change Password'}
              </Link>
            )}

            {/* User Manual (PDF Documentation) */}
            <a
              href="/Secure_File_Sharing_User_Manual.pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '0.75rem 1.1rem',
                color: '#150202',
                fontWeight: 600,
                fontSize: '0.88rem',
                textDecoration: 'none',
                borderBottom: '3px solid transparent',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>{isHindi ? 'उपयोगकर्ता मैनुअल (PDF)' : 'User Manual (PDF)'}</span>
              <span style={{ fontSize: '0.75rem', color: '#606060' }}>↗</span>
            </a>

            {/* Admin Dashboard (if admin) */}
            {isAdmin && (
              <Link
                to="/admin"
                style={{
                  padding: '0.75rem 1.1rem',
                  color: location.pathname === '/admin' ? '#214AAB' : '#150202',
                  fontWeight: location.pathname === '/admin' ? 700 : 600,
                  fontSize: '0.88rem',
                  textDecoration: 'none',
                  borderBottom: location.pathname === '/admin' ? '3px solid #214AAB' : '3px solid transparent',
                }}
              >
                {isHindi ? 'एडमिन कंसोल' : 'Admin Console'}
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Accessibility Modal */}
      <AccessibilityModal isOpen={isA11yOpen} onClose={() => setIsA11yOpen(false)} />

      {/* Global Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}
