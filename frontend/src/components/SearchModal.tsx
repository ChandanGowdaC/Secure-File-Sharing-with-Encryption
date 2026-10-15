import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconSearch } from './LineIcons'
import { useLanguage } from '../context/LanguageContext'

interface SearchItem {
  id: string
  titleEn: string
  titleHi: string
  categoryEn: 'Services' | 'Documentation' | 'Security' | 'Account'
  categoryHi: string
  descriptionEn: string
  descriptionHi: string
  link: string
  tags: string[]
}

const SEARCH_DATABASE: SearchItem[] = [
  {
    id: 's1',
    titleEn: 'Send File (Upload)',
    titleHi: 'फ़ाइल भेजें (अपलोड)',
    categoryEn: 'Services',
    categoryHi: 'सेवाएं',
    descriptionEn: 'Encrypt a file in your browser and securely send it to another registered user.',
    descriptionHi: 'अपने ब्राउज़र में फ़ाइल को एन्क्रिप्ट करें और पंजीकृत उपयोगकर्ता को सुरक्षित रूप से भेजें।',
    link: '/upload',
    tags: ['upload', 'send', 'encrypt', 'files', 'transfer', 'अपलोड', 'भेजें'],
  },
  {
    id: 's2',
    titleEn: 'Recipient Inbox',
    titleHi: 'प्राप्तकर्ता इनबॉक्स',
    categoryEn: 'Services',
    categoryHi: 'सेवाएं',
    descriptionEn: 'View incoming transfers, decrypt files in the browser, or download raw ciphertext (.bin).',
    descriptionHi: 'आवक स्थानांतरण देखें, ब्राउज़र में फ़ाइलों को डिक्रिप्ट करें, या सिफरटेक्स्ट डाउनलोड करें।',
    link: '/inbox',
    tags: ['inbox', 'received', 'decrypt', 'download', 'files', 'bin', 'इनबॉक्स', 'डिक्रिप्ट'],
  },
  {
    id: 's3',
    titleEn: 'Change Password',
    titleHi: 'पासवर्ड बदलें',
    categoryEn: 'Account',
    categoryHi: 'खाता',
    descriptionEn: 'Update your account password while keeping your encryption keys safe.',
    descriptionHi: 'अपनी एन्क्रिप्शन कुंजियों को सुरक्षित रखते हुए खाता पासवर्ड अपडेट करें।',
    link: '/change-password',
    tags: ['password', 'change password', 'account', 'security', 'update', 'पासवर्ड'],
  },
  {
    id: 'd1',
    titleEn: 'User Manual (PDF)',
    titleHi: 'उपयोगकर्ता नियमावली (PDF)',
    categoryEn: 'Documentation',
    categoryHi: 'दस्तावेज़ीकरण',
    descriptionEn: 'Comprehensive user guide with step-by-step instructions and screenshots.',
    descriptionHi: 'चरण-दर-चरण निर्देशों और स्क्रीनशॉट के साथ व्यापक मार्गदर्शिका।',
    link: '/Secure_File_Sharing_User_Manual.pdf',
    tags: ['manual', 'pdf', 'guide', 'documentation', 'help', 'instructions', 'नियमावली'],
  },
  {
    id: 's4',
    titleEn: 'Sign In',
    titleHi: 'साइन इन करें',
    categoryEn: 'Account',
    categoryHi: 'खाता',
    descriptionEn: 'Log in to your account with password and two-factor authentication (2FA).',
    descriptionHi: 'पासवर्ड और दो-चरणीय प्रमाणीकरण (2FA) के साथ अपने खाते में लॉगिन करें।',
    link: '/login',
    tags: ['login', 'signin', '2fa', 'totp', 'auth', 'लॉगिन', 'साइन इन'],
  },
  {
    id: 's5',
    titleEn: 'Register Account',
    titleHi: 'खाता पंजीकृत करें',
    categoryEn: 'Account',
    categoryHi: 'खाता',
    descriptionEn: 'Create a new account and generate your encryption keys in the browser.',
    descriptionHi: 'नया खाता बनाएं और ब्राउज़र में अपनी एन्क्रिप्शन कुंजियाँ उत्पन्न करें।',
    link: '/register',
    tags: ['register', 'signup', 'keys', 'keypair', 'indexeddb', 'पंजीकरण'],
  },
  {
    id: 's6',
    titleEn: 'Forgot Password',
    titleHi: 'पासवर्ड भूल गए',
    categoryEn: 'Account',
    categoryHi: 'खाता',
    descriptionEn: 'Reset your password using an email verification code (OTP).',
    descriptionHi: 'ईमेल सत्यापन कोड (ओटीपी) का उपयोग करके अपना पासवर्ड रीसेट करें।',
    link: '/forgot-password',
    tags: ['password', 'reset', 'forgot', 'otp', 'recovery', 'पासवर्ड'],
  },
  {
    id: 's7',
    titleEn: 'Admin Console',
    titleHi: 'व्यवस्थापक कंसोल',
    categoryEn: 'Security',
    categoryHi: 'सुरक्षा',
    descriptionEn: 'View system audit logs, registered users, and active transfers (admin only).',
    descriptionHi: 'सिस्टम ऑडिट लॉग, पंजीकृत उपयोगकर्ता और सक्रिय स्थानांतरण देखें।',
    link: '/admin',
    tags: ['audit', 'logs', 'admin', 'users', 'transfers', 'security', 'ऑडिट', 'प्रशासन'],
  },
  {
    id: 'sec1',
    titleEn: 'Security & Architecture',
    titleHi: 'सुरक्षा एवं वास्तुकला',
    categoryEn: 'Documentation',
    categoryHi: 'दस्तावेज़ीकरण',
    descriptionEn: 'Overview of AES-256-GCM authenticated encryption and DH key agreement.',
    descriptionHi: 'AES-256-GCM प्रमाणीकृत एन्क्रिप्शन और DH कुंजी समझौते का अवलोकन।',
    link: '/',
    tags: ['crypto', 'algorithm', 'security', 'aes', 'gcm', 'dh', 'diffie-hellman', 'सुरक्षा'],
  },
  {
    id: 'info1',
    titleEn: 'Project Creators & Guidance (IT303)',
    titleHi: 'परियोजना निर्माता एवं मार्गदर्शन (IT303)',
    categoryEn: 'Documentation',
    categoryHi: 'दस्तावेज़ीकरण',
    descriptionEn: 'Developed by Prabhav P (241IT053), Sucheth K Katte (241IT078), and Chandan Gowda C (241IT016) under Dr. Jaidhar C D at NITK Surathkal.',
    descriptionHi: 'एनआईटीके सुरथकल में डॉ. जयधर सी डी के मार्गदर्शन में प्रभाव पी (241IT053), सुचेत के कट्टे (241IT078) और चंदन गौड़ा सी (241IT016) द्वारा विकसित।',
    link: '/',
    tags: ['creators', 'contact', 'email', 'nitk', 'jaidhar', 'it303', 'authors', 'roll number', 'prabhav', 'sucheth', 'chandan', 'निर्माता'],
  },
]

export const SearchModal: React.FC<{
  isOpen: boolean
  onClose: () => void
}> = ({ isOpen, onClose }) => {
  const { t, isHindi } = useLanguage()
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const navigate = useNavigate()

  const categories = [
    { key: 'All', labelEn: 'All', labelHi: 'सभी' },
    { key: 'Services', labelEn: 'Services', labelHi: 'सेवाएं' },
    { key: 'Documentation', labelEn: 'Documentation', labelHi: 'दस्तावेज़ीकरण' },
    { key: 'Security', labelEn: 'Security', labelHi: 'सुरक्षा' },
    { key: 'Account', labelEn: 'Account', labelHi: 'खाता' },
  ]

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SEARCH_DATABASE.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.categoryEn === selectedCategory
      if (!matchesCategory) return false
      if (!q) return true
      const title = isHindi ? item.titleHi : item.titleEn
      const desc = isHindi ? item.descriptionHi : item.descriptionEn
      return (
        item.titleEn.toLowerCase().includes(q) ||
        item.titleHi.toLowerCase().includes(q) ||
        title.toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    })
  }, [query, selectedCategory, isHindi])

  if (!isOpen) return null

  const handleSelectResult = (item: SearchItem) => {
    onClose()
    if (item.link.startsWith('http') || item.link.endsWith('.pdf')) {
      window.open(item.link, '_blank')
    } else {
      navigate(item.link)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(21, 2, 2, 0.45)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '5vh',
        zIndex: 100000,
        fontFamily: "'Noto Sans', sans-serif",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          width: '92%',
          maxWidth: '680px',
          maxHeight: '82vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
          border: '1px solid #C6C6C6',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #EBEAEA',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            backgroundColor: '#F8FAFC',
          }}
        >
          <IconSearch size={22} color="#162F6A" />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Search pages, transfers, user manual...', 'पृष्ठ, स्थानांतरण, उपयोगकर्ता नियमावली खोजें...')}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: '1.05rem',
              color: '#150202',
              outline: 'none',
              fontWeight: 500,
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label={t('Clear search', 'खोज साफ़ करें')}
              style={{
                background: 'none',
                border: 'none',
                color: '#606060',
                fontSize: '1.25rem',
                cursor: 'pointer',
                padding: '2px 6px',
              }}
            >
              &times;
            </button>
          )}
          <button
            onClick={onClose}
            aria-label={t('Close search', 'खोज बंद करें')}
            style={{
              background: '#FFFFFF',
              border: '1px solid #C6C6C6',
              borderRadius: '4px',
              padding: '0.25rem 0.6rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#606060',
              cursor: 'pointer',
            }}
          >
            ESC
          </button>
        </div>

        {/* Filter Pills */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            borderBottom: '1px solid #EBEAEA',
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            backgroundColor: '#FFFFFF',
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              style={{
                padding: '0.3rem 0.8rem',
                borderRadius: '16px',
                border: selectedCategory === cat.key ? '1px solid #214AAB' : '1px solid #EBEAEA',
                backgroundColor: selectedCategory === cat.key ? '#EEF2FF' : '#F8FAFC',
                color: selectedCategory === cat.key ? '#214AAB' : '#606060',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {isHindi ? cat.labelHi : cat.labelEn}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
          {filteredResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#606060' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
              <p style={{ margin: 0, fontWeight: 600 }}>
                {t(`No results found for "${query}"`, `"${query}" के लिए कोई परिणाम नहीं मिला`)}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                {t('Try searching for "upload", "inbox", "manual", "aes", or "dh".', '“अपलोड”, “इनबॉक्स”, “नियमावली”, “aes”, या “dh” खोज कर देखें।')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectResult(item)}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #EBEAEA',
                    backgroundColor: '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, background-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F8FAFC'
                    e.currentTarget.style.borderColor = '#214AAB'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF'
                    e.currentTarget.style.borderColor = '#EBEAEA'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#162F6A', margin: 0 }}>
                      {isHindi ? item.titleHi : item.titleEn}
                    </h4>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: '#EEF2FF',
                        color: '#214AAB',
                        fontWeight: 600,
                      }}
                    >
                      {isHindi ? item.categoryHi : item.categoryEn}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: '0.83rem', color: '#606060', lineHeight: 1.4 }}>
                    {isHindi ? item.descriptionHi : item.descriptionEn}
                  </p>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {item.tags.map((tg) => (
                      <span
                        key={tg}
                        style={{
                          fontSize: '0.7rem',
                          background: '#F1F5F9',
                          color: '#475569',
                          padding: '1px 6px',
                          borderRadius: '3px',
                        }}
                      >
                        #{tg}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div
          style={{
            padding: '0.65rem 1.5rem',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #EBEAEA',
            fontSize: '0.76rem',
            color: '#606060',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{t('Navigate with mouse or keyboard • Press ESC to exit', 'माउस या कीबोर्ड से नेविगेट करें • बाहर निकलने के लिए ESC दबाएं')}</span>
          <span>{filteredResults.length} {t('matching items', 'मेल खाते परिणाम')}</span>
        </div>
      </div>
    </div>
  )
}
