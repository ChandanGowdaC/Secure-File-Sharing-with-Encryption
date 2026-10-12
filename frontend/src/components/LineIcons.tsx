import React from 'react'

export type IconSize = 16 | 18 | 20 | 22 | 24 | 28 | 32 | 48 | 64 | number

interface IconProps {
  size?: IconSize
  color?: string
  className?: string
  title?: string
}

// Voice Icon (DBIM Figure 3)
export const IconVoice: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '', title }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ padding: 2 }}>
    {title && <title>{title}</title>}
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
)

// Email Icon (DBIM Figure 3 & Figure 5)
export const IconEmail: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '', title }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ padding: 2 }}>
    {title && <title>{title}</title>}
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
)

// Search Icon (DBIM Figure 3)
export const IconSearch: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '', title }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ padding: 2 }}>
    {title && <title>{title}</title>}
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

// Camera Icon (DBIM Figure 3 & Figure 5)
export const IconCamera: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '', title }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ padding: 2 }}>
    {title && <title>{title}</title>}
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
)

// Play Icon (DBIM Figure 5)
export const IconPlay: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '', title }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ padding: 2 }}>
    {title && <title>{title}</title>}
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
)

// Schemes Icon (DBIM Figure 4 Contextual Icon)
export const IconSchemes: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '', title }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ padding: 2 }}>
    {title && <title>{title}</title>}
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

// Competitions Icon (DBIM Figure 4 Contextual Icon)
export const IconCompetitions: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '', title }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ padding: 2 }}>
    {title && <title>{title}</title>}
    <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
    <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H7c-.55 0-1 .45-1 1v3h12v-3c0-.55-.45-1-1-1h-2c-.55 0-1-.45-1-1v-2.34" />
    <path d="M6 3h12v7a6 6 0 0 1-12 0V3z" />
  </svg>
)

// Parliament / Government Institutions Icon (DBIM Figure 4 Contextual Icon)
export const IconParliament: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '', title }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ padding: 2 }}>
    {title && <title>{title}</title>}
    <line x1="3" y1="21" x2="21" y2="21" />
    <line x1="4" y1="10" x2="20" y2="10" />
    <polygon points="12 3 3 8 21 8 12 3" />
    <line x1="6" y1="10" x2="6" y2="21" />
    <line x1="10" y1="10" x2="10" y2="21" />
    <line x1="14" y1="10" x2="14" y2="21" />
    <line x1="18" y1="10" x2="18" y2="21" />
  </svg>
)

// Policies / Documents Icon (DBIM Figure 4 Contextual Icon)
export const IconPolicies: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '', title }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ padding: 2 }}>
    {title && <title>{title}</title>}
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

// Download Icon (DBIM Figure 13 CTA Action)
export const IconDownload: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '', title }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ padding: 2 }}>
    {title && <title>{title}</title>}
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

// View / Eye Icon (DBIM Figure 13 CTA Action)
export const IconView: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '', title }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ padding: 2 }}>
    {title && <title>{title}</title>}
    <circle cx="12" cy="12" r="3" />
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
  </svg>
)

// Add Icon (DBIM Figure 13 CTA Action)
export const IconAdd: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '', title }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ padding: 2 }}>
    {title && <title>{title}</title>}
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
)

// Security Shield Icon
export const IconShield: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '', title }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ padding: 2 }}>
    {title && <title>{title}</title>}
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

// Key / Crypto Lock Icon
export const IconLock: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '', title }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ padding: 2 }}>
    {title && <title>{title}</title>}
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

// Upload Icon
export const IconUpload: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '', title }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ padding: 2 }}>
    {title && <title>{title}</title>}
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

// User / Accessibility Persona Icon (DBIM Figure 42 & Figure 46)
export const IconAccessibility: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '', title }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ padding: 2 }}>
    {title && <title>{title}</title>}
    <circle cx="12" cy="4" r="2" />
    <path d="M5 9h14" />
    <path d="M12 9v6" />
    <path d="M9 20l3-5 3 5" />
  </svg>
)
