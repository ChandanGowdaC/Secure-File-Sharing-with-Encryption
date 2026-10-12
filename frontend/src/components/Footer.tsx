import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { FooterModals, type FooterModalType } from './FooterModals'

export const Footer: React.FC = () => {
  const [activeModal, setActiveModal] = useState<FooterModalType>(null)

  return (
    <>
      <footer
        role="contentinfo"
        style={{
          backgroundColor: '#F8FAFC',
          borderTop: '2px solid #EBEAEA',
          color: '#150202',
          padding: '2.5rem 2rem 1.5rem',
          fontFamily: "'Noto Sans', sans-serif",
          boxShadow: '0 -2px 10px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          {/* Main Footer Columns */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '2rem',
              paddingBottom: '2rem',
              borderBottom: '1px solid #EBEAEA',
            }}
          >
            {/* Column 1: Quick Navigation */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#162F6A', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Portal Navigation
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                <li>
                  <Link to="/" style={{ color: '#214AAB', textDecoration: 'none', fontWeight: 500 }}>
                    › Home Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/upload" style={{ color: '#214AAB', textDecoration: 'none', fontWeight: 500 }}>
                    › Send Encrypted File
                  </Link>
                </li>
                <li>
                  <Link to="/inbox" style={{ color: '#214AAB', textDecoration: 'none', fontWeight: 500 }}>
                    › Recipient Inbox
                  </Link>
                </li>
                <li>
                  <a href="/Secure_File_Sharing_User_Manual.pdf" target="_blank" rel="noopener noreferrer" style={{ color: '#214AAB', textDecoration: 'none', fontWeight: 500 }}>
                    › User Manual (PDF) ↗
                  </a>
                </li>
                <li>
                  <Link to="/login" style={{ color: '#214AAB', textDecoration: 'none', fontWeight: 500 }}>
                    › Sign In &amp; 2FA Authentication
                  </Link>
                </li>
                <li>
                  <Link to="/register" style={{ color: '#214AAB', textDecoration: 'none', fontWeight: 500 }}>
                    › Key Vault Registration
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Cryptographic Features */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#162F6A', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Cryptographic Specs
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: '#606060' }}>
                <li>• <strong>AES-256-GCM</strong> Authenticated Encryption</li>
                <li>• <strong>ECDH Curve P-256</strong> Key Exchange</li>
                <li>• <strong>HKDF-SHA256</strong> Ephemeral Derivation</li>
                <li>• <strong>IndexedDB Vault</strong> Non-Exportable Keys</li>
                <li>• <strong>TOTP 2FA</strong> Multi-Factor Protection</li>
                <li>• <strong>SHA-256</strong> Immutable Forensic Audit Logs</li>
              </ul>
            </div>

            {/* Column 3: Project Overview */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#162F6A', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Project Overview
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#606060', marginBottom: '0.85rem', lineHeight: 1.5 }}>
                Academic &amp; Engineering project implementing browser-based end-to-end encryption for secure file transfers.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', color: '#606060' }}>
                <li>• Zero server knowledge</li>
                <li>• Client-side key derivation</li>
                <li>• Web Cryptography API</li>
              </ul>
            </div>

            {/* Column 4: Policies & Team Contact */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#162F6A', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Policies &amp; Feedback
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('policies')}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#214AAB', cursor: 'pointer', textAlign: 'left', font: 'inherit', fontWeight: 500 }}
                  >
                    › Website &amp; Privacy Policies
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('sitemap')}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#214AAB', cursor: 'pointer', textAlign: 'left', font: 'inherit', fontWeight: 500 }}
                  >
                    › Sitemap (2-Tier Hierarchy)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('help')}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#214AAB', cursor: 'pointer', textAlign: 'left', font: 'inherit', fontWeight: 500 }}
                  >
                    › Screen Reader &amp; Help Guide
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('feedback')}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#214AAB', cursor: 'pointer', textAlign: 'left', font: 'inherit', fontWeight: 500 }}
                  >
                    › Submit Feedback / Defect
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('contact')}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#214AAB', cursor: 'pointer', textAlign: 'left', font: 'inherit', fontWeight: 600 }}
                  >
                    › Contact Creators (Official Emails)
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Attribution & Lineage Statement */}
          <div
            style={{
              paddingTop: '1.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              fontSize: '0.82rem',
              color: '#606060',
            }}
          >
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#150202' }}>
                Secure File Sharing with Client-Side Encryption
              </p>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#162F6A', fontWeight: 600 }}>
                IT303 Software Engineering Course Project &bull; NITK Surathkal
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem' }}>
                Developed by <strong>Prabhav P (241IT053)</strong>, <strong>Sucheth K Katte (241IT078)</strong>, and <strong>Chandan Gowda C (241IT016)</strong>
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#606060' }}>
                Under the Guidance of <strong>Dr. Jaidhar C D</strong>, Dept. of Information Technology
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, color: '#150202' }}>
                Last Updated On: <span style={{ color: '#214AAB' }}>12 October 2026</span>
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                Software Engineering Project &bull; Zero Plaintext Retention
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive Modals */}
      <FooterModals activeModal={activeModal} onClose={() => setActiveModal(null)} />
    </>
  )
}
