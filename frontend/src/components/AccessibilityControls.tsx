import React, { useEffect, useState } from 'react'

export interface AccessibilityState {
  contrast: 'light' | 'high'
  invert: boolean
  grayscale: boolean
  fontSizeStep: number // -1, 0, 1, 2
  highlightLinks: boolean
  hideImages: boolean
  largeCursor: boolean
}

const STORAGE_KEY = 'gov_dbim_accessibility_settings'

export const AccessibilityModal: React.FC<{
  isOpen: boolean
  onClose: () => void
}> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AccessibilityState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return {
      contrast: 'light',
      invert: false,
      grayscale: false,
      fontSizeStep: 0,
      highlightLinks: false,
      hideImages: false,
      largeCursor: false,
    }
  })

  // Apply settings to document root & body
  useEffect(() => {
    const root = document.documentElement
    const body = document.body

    // High contrast
    if (settings.contrast === 'high') {
      root.classList.add('a11y-high-contrast')
    } else {
      root.classList.remove('a11y-high-contrast')
    }

    // Invert
    if (settings.invert) {
      root.classList.add('a11y-invert')
    } else {
      root.classList.remove('a11y-invert')
    }

    // Grayscale / Saturation
    if (settings.grayscale) {
      root.classList.add('a11y-grayscale')
    } else {
      root.classList.remove('a11y-grayscale')
    }

    // Font size scaling
    root.classList.remove('a11y-text-sm', 'a11y-text-lg', 'a11y-text-xl')
    if (settings.fontSizeStep === -1) root.classList.add('a11y-text-sm')
    if (settings.fontSizeStep === 1) root.classList.add('a11y-text-lg')
    if (settings.fontSizeStep === 2) root.classList.add('a11y-text-xl')

    // Highlight links
    if (settings.highlightLinks) {
      body.classList.add('a11y-highlight-links')
    } else {
      body.classList.remove('a11y-highlight-links')
    }

    // Hide images
    if (settings.hideImages) {
      body.classList.add('a11y-hide-images')
    } else {
      body.classList.remove('a11y-hide-images')
    }

    // Large / Default cursor
    if (settings.largeCursor) {
      body.classList.add('a11y-large-cursor')
    } else {
      body.classList.remove('a11y-large-cursor')
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // ignore
    }
  }, [settings])

  if (!isOpen) return null

  const handleReset = () => {
    setSettings({
      contrast: 'light',
      invert: false,
      grayscale: false,
      fontSizeStep: 0,
      highlightLinks: false,
      hideImages: false,
      largeCursor: false,
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="a11y-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(21, 2, 2, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          border: '2px solid #EBEAEA',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '480px',
          padding: '1.75rem',
          boxShadow: '0 12px 32px rgba(21, 2, 2, 0.15)',
          color: '#150202',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #EBEAEA',
            paddingBottom: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#214AAB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="4" r="2" />
              <path d="M5 9h14" />
              <path d="M12 9v6" />
              <path d="M9 20l3-5 3 5" />
            </svg>
            <h3 id="a11y-modal-title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#150202' }}>
              Accessibility Controls
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Accessibility Controls"
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

        {/* 8 Accessibility Buttons Grid as per Figure 44 (Page 67, DBIM) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.85rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* 1. Dark/High Contrast */}
          <button
            type="button"
            onClick={() => setSettings((s) => ({ ...s, contrast: s.contrast === 'high' ? 'light' : 'high' }))}
            style={{
              padding: '0.85rem 0.5rem',
              borderRadius: '8px',
              border: settings.contrast === 'high' ? '2px solid #214AAB' : '1px solid #C6C6C6',
              background: settings.contrast === 'high' ? '#D2DFFF' : '#FFFFFF',
              color: '#150202',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>◉</span>
            HIGH CONTRAST
          </button>

          {/* 2. Invert */}
          <button
            type="button"
            onClick={() => setSettings((s) => ({ ...s, invert: !s.invert }))}
            style={{
              padding: '0.85rem 0.5rem',
              borderRadius: '8px',
              border: settings.invert ? '2px solid #214AAB' : '1px solid #C6C6C6',
              background: settings.invert ? '#D2DFFF' : '#FFFFFF',
              color: '#150202',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>◐</span>
            INVERT COLORS
          </button>

          {/* 3. Saturation */}
          <button
            type="button"
            onClick={() => setSettings((s) => ({ ...s, grayscale: !s.grayscale }))}
            style={{
              padding: '0.85rem 0.5rem',
              borderRadius: '8px',
              border: settings.grayscale ? '2px solid #214AAB' : '1px solid #C6C6C6',
              background: settings.grayscale ? '#D2DFFF' : '#FFFFFF',
              color: '#150202',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>◑</span>
            SATURATION
          </button>

          {/* 4. Text Size Increase (A+) */}
          <button
            type="button"
            onClick={() => setSettings((s) => ({ ...s, fontSizeStep: Math.min(2, s.fontSizeStep + 1) }))}
            style={{
              padding: '0.85rem 0.5rem',
              borderRadius: '8px',
              border: settings.fontSizeStep > 0 ? '2px solid #214AAB' : '1px solid #C6C6C6',
              background: settings.fontSizeStep > 0 ? '#D2DFFF' : '#FFFFFF',
              color: '#150202',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>A+</span>
            TEXT SIZE INCREASE
          </button>

          {/* 5. Text Size Decrease (A-) */}
          <button
            type="button"
            onClick={() => setSettings((s) => ({ ...s, fontSizeStep: Math.max(-1, s.fontSizeStep - 1) }))}
            style={{
              padding: '0.85rem 0.5rem',
              borderRadius: '8px',
              border: settings.fontSizeStep < 0 ? '2px solid #214AAB' : '1px solid #C6C6C6',
              background: settings.fontSizeStep < 0 ? '#D2DFFF' : '#FFFFFF',
              color: '#150202',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>A-</span>
            TEXT SIZE DECREASE
          </button>

          {/* 6. Highlight Links */}
          <button
            type="button"
            onClick={() => setSettings((s) => ({ ...s, highlightLinks: !s.highlightLinks }))}
            style={{
              padding: '0.85rem 0.5rem',
              borderRadius: '8px',
              border: settings.highlightLinks ? '2px solid #214AAB' : '1px solid #C6C6C6',
              background: settings.highlightLinks ? '#D2DFFF' : '#FFFFFF',
              color: '#150202',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>🔗</span>
            HIGHLIGHT LINKS
          </button>

          {/* 7. Hide Images */}
          <button
            type="button"
            onClick={() => setSettings((s) => ({ ...s, hideImages: !s.hideImages }))}
            style={{
              padding: '0.85rem 0.5rem',
              borderRadius: '8px',
              border: settings.hideImages ? '2px solid #214AAB' : '1px solid #C6C6C6',
              background: settings.hideImages ? '#D2DFFF' : '#FFFFFF',
              color: '#150202',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>⃠</span>
            HIDE IMAGES
          </button>

          {/* 8. Default / High-Vis Cursor */}
          <button
            type="button"
            onClick={() => setSettings((s) => ({ ...s, largeCursor: !s.largeCursor }))}
            style={{
              padding: '0.85rem 0.5rem',
              borderRadius: '8px',
              border: settings.largeCursor ? '2px solid #214AAB' : '1px solid #C6C6C6',
              background: settings.largeCursor ? '#D2DFFF' : '#FFFFFF',
              color: '#150202',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>⤹</span>
            LARGE CURSOR
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: '0.55rem 1.1rem',
              borderRadius: '6px',
              border: '1px solid #C6C6C6',
              background: '#EBEAEA',
              color: '#150202',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.55rem 1.3rem',
              borderRadius: '6px',
              border: 'none',
              background: '#214AAB',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
