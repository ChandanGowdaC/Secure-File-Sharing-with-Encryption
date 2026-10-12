import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconSearch } from './LineIcons'

interface SearchItem {
  id: string
  title: string
  category: 'Services' | 'Documentation' | 'Security' | 'Account'
  description: string
  link: string
  tags: string[]
}

const SEARCH_DATABASE: SearchItem[] = [
  {
    id: 's1',
    title: 'Send File (Upload)',
    category: 'Services',
    description: 'Encrypt a file in your browser and securely send it to another registered user.',
    link: '/upload',
    tags: ['upload', 'send', 'encrypt', 'files', 'transfer'],
  },
  {
    id: 's2',
    title: 'Recipient Inbox',
    category: 'Services',
    description: 'View incoming transfers, decrypt files in the browser, or download raw ciphertext (.bin).',
    link: '/inbox',
    tags: ['inbox', 'received', 'decrypt', 'download', 'files', 'bin'],
  },
  {
    id: 's3',
    title: 'Change Password',
    category: 'Account',
    description: 'Update your account password while keeping your encryption keys safe.',
    link: '/change-password',
    tags: ['password', 'change password', 'account', 'security', 'update'],
  },
  {
    id: 'd1',
    title: 'User Manual (PDF)',
    category: 'Documentation',
    description: 'Comprehensive user guide with step-by-step instructions and screenshots.',
    link: '/Secure_File_Sharing_User_Manual.pdf',
    tags: ['manual', 'pdf', 'guide', 'documentation', 'help', 'instructions'],
  },
  {
    id: 's4',
    title: 'Sign In',
    category: 'Account',
    description: 'Log in to your account with password and two-factor authentication (2FA).',
    link: '/login',
    tags: ['login', 'signin', '2fa', 'totp', 'auth'],
  },
  {
    id: 's5',
    title: 'Register Account',
    category: 'Account',
    description: 'Create a new account and generate your encryption keys in the browser.',
    link: '/register',
    tags: ['register', 'signup', 'keys', 'keypair', 'indexeddb'],
  },
  {
    id: 's6',
    title: 'Forgot Password',
    category: 'Account',
    description: 'Reset your password using an email verification code (OTP).',
    link: '/forgot-password',
    tags: ['password', 'reset', 'forgot', 'otp', 'recovery'],
  },
  {
    id: 's7',
    title: 'Admin Console',
    category: 'Security',
    description: 'View system audit logs, registered users, and active transfers (admin only).',
    link: '/admin',
    tags: ['audit', 'logs', 'admin', 'users', 'transfers', 'security'],
  },
  {
    id: 'sec1',
    title: 'Security & Architecture',
    category: 'Documentation',
    description: 'Overview of AES-256-GCM authenticated encryption and ECDH key agreement.',
    link: '/',
    tags: ['crypto', 'algorithm', 'security', 'aes', 'gcm', 'ecdh'],
  },
  {
    id: 'info1',
    title: 'Project Creators & Guidance (IT303)',
    category: 'Documentation',
    description: 'Developed by Prabhav P (241IT053), Sucheth K Katte (241IT078), and Chandan Gowda C (241IT016) under Dr. Jaidhar C D at NITK Surathkal.',
    link: '/',
    tags: ['creators', 'contact', 'email', 'nitk', 'jaidhar', 'it303', 'authors', 'roll number', 'prabhav', 'sucheth', 'chandan'],
  },
]

export const SearchModal: React.FC<{
  isOpen: boolean
  onClose: () => void
}> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const navigate = useNavigate()

  const categories = ['All', 'Services', 'Documentation', 'Security', 'Account']

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SEARCH_DATABASE.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
      if (!matchesCategory) return false
      if (!q) return true
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    })
  }, [query, selectedCategory])

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
            placeholder="Search pages, transfers, user manual..."
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
              aria-label="Clear search"
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
            aria-label="Close search"
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
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '0.3rem 0.8rem',
                borderRadius: '16px',
                border: selectedCategory === cat ? '1px solid #214AAB' : '1px solid #EBEAEA',
                backgroundColor: selectedCategory === cat ? '#EEF2FF' : '#F8FAFC',
                color: selectedCategory === cat ? '#214AAB' : '#606060',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
          {filteredResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#606060' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
              <p style={{ margin: 0, fontWeight: 600 }}>No results found for &quot;{query}&quot;</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                Try searching for &quot;upload&quot;, &quot;inbox&quot;, &quot;manual&quot;, &quot;aes&quot;, or &quot;key&quot;.
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
                      {item.title}
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
                      {item.category}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: '0.83rem', color: '#606060', lineHeight: 1.4 }}>
                    {item.description}
                  </p>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {item.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: '0.7rem',
                          background: '#F1F5F9',
                          color: '#475569',
                          padding: '1px 6px',
                          borderRadius: '3px',
                        }}
                      >
                        #{t}
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
          <span>Navigate with mouse or keyboard &bull; Press <kbd>ESC</kbd> to exit</span>
          <span>{filteredResults.length} matching items</span>
        </div>
      </div>
    </div>
  )
}
