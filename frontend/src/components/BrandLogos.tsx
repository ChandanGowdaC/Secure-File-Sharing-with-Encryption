import React from 'react'

// Institutional Project Seal / Emblem
// Conforms to DBIM Section 5.1/5.2 Seal & Emblem Guidelines (Mathematical proportions, clean geometry)
export const ProjectEmblem: React.FC<{ size?: number; className?: string; color?: string }> = ({
  size = 54,
  className = '',
  color = '#162F6A',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Secure File Sharing Project Seal"
      role="img"
    >
      <title>Secure File Sharing Seal</title>
      {/* Outer circular crest with double border */}
      <circle cx="50" cy="50" r="47" stroke={color} strokeWidth="2.5" fill="#FFFFFF" />
      <circle cx="50" cy="50" r="42" stroke={color} strokeWidth="1" strokeDasharray="3 2" fill="none" />
      
      {/* Central Shield */}
      <path
        d="M50 18 L74 27 V52 C74 67 63 78 50 83 C37 78 26 67 26 52 V27 L50 18 Z"
        fill="#F0F4FF"
        stroke={color}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Cryptographic Lock Body & Shackle */}
      <rect x="41" y="47" width="18" height="15" rx="3" fill={color} />
      <path
        d="M44 47 V40 C44 36.7 46.7 34 50 34 C53.3 34 56 36.7 56 40 V47"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Keyhole */}
      <circle cx="50" cy="53" r="2" fill="#FFFFFF" />
      <line x1="50" y1="54" x2="50" y2="58" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />

      {/* Subtle Digital Circuit Nodes */}
      <circle cx="34" cy="42" r="1.5" fill="#5279D7" />
      <line x1="34" y1="42" x2="41" y2="47" stroke="#5279D7" strokeWidth="1" />
      <circle cx="66" cy="42" r="1.5" fill="#5279D7" />
      <line x1="66" y1="42" x2="59" y2="47" stroke="#5279D7" strokeWidth="1" />
    </svg>
  )
}

// Conformance badges removed as requested
export const StandardsBadge: React.FC<{ height?: number; className?: string }> = () => null
export const ZeroKnowledgeBadge: React.FC<{ height?: number; className?: string }> = () => null

