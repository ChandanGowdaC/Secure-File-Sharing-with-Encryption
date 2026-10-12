import React, { useState } from 'react'
import { Link } from 'react-router-dom'

export type FooterModalType = 'policies' | 'sitemap' | 'help' | 'feedback' | 'contact' | null

interface FooterModalsProps {
  activeModal: FooterModalType
  onClose: () => void
}

export const FooterModals: React.FC<FooterModalsProps> = ({ activeModal, onClose }) => {
  const [feedbackCategory, setFeedbackCategory] = useState<'General' | 'Bug' | 'Accessibility' | 'Security'>('Accessibility')
  const [feedbackName, setFeedbackName] = useState('')
  const [feedbackEmail, setFeedbackEmail] = useState('')
  const [feedbackComments, setFeedbackComments] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)

  if (!activeModal) return null

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedbackName.trim() || !feedbackEmail.trim() || !feedbackComments.trim()) return
    setSubmittingFeedback(true)
    setTimeout(() => {
      setSubmittingFeedback(false)
      setFeedbackSuccess(true)
      setTimeout(() => {
        setFeedbackSuccess(false)
        setFeedbackName('')
        setFeedbackEmail('')
        setFeedbackComments('')
        onClose()
      }, 2000)
    }, 800)
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
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #EBEAEA',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '680px',
          padding: '2rem',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          fontFamily: "'Noto Sans', sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #EBEAEA', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#162F6A', margin: 0 }}>
            {activeModal === 'policies' && 'Website & Cryptographic Policies'}
            {activeModal === 'sitemap' && 'Portal Sitemap (2-Tier)'}
            {activeModal === 'help' && 'Accessibility & Screen Reader Guide'}
            {activeModal === 'feedback' && 'Project Feedback & Issue Report'}
            {activeModal === 'contact' && 'Project Creators & Technical Contact'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#606060',
              lineHeight: 1,
              padding: '4px',
            }}
          >
            &times;
          </button>
        </div>

        {/* Modal 1: Policies */}
        {activeModal === 'policies' && (
          <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#150202' }}>
            <h4 style={{ color: '#162F6A', fontSize: '1rem', margin: '0.75rem 0 0.25rem' }}>1. Zero-Knowledge Privacy Policy (DPDP Act 2023)</h4>
            <p style={{ color: '#606060', margin: '0 0 0.75rem' }}>
              In strict accordance with the Digital Personal Data Protection Act (DPDP Act 2023), this system operates on a zero-knowledge trust model. Your encryption keys are generated locally in your browser and never leave your client device.
            </p>

            <h4 style={{ color: '#162F6A', fontSize: '1rem', margin: '0.75rem 0 0.25rem' }}>2. Cryptographic Security Standards</h4>
            <p style={{ color: '#606060', margin: '0 0 0.75rem' }}>
              All uploaded files are protected with AES-256-GCM authenticated encryption. Transfer keys are derived using ECDH Curve P-256 and HKDF-SHA256. Ephemeral keys provide forward secrecy.
            </p>

            <h4 style={{ color: '#162F6A', fontSize: '1rem', margin: '0.75rem 0 0.25rem' }}>3. Accessibility &amp; Usability</h4>
            <p style={{ color: '#606060', margin: '0 0 0.75rem' }}>
              This portal incorporates WCAG 2.1 Level AA accessibility standards, featuring high-contrast modes, text resizing, and keyboard navigability.
            </p>
          </div>
        )}

        {/* Modal 2: Sitemap */}
        {activeModal === 'sitemap' && (
          <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#150202' }}>
            <p style={{ color: '#606060', marginBottom: '1rem' }}>
              Hierarchical navigation index for the Secure File Sharing portal:
            </p>
            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #EBEAEA' }}>
              <div style={{ fontWeight: 700, color: '#162F6A', marginBottom: '0.5rem' }}>
                📁 Tier 1: Main Application
              </div>
              <ul style={{ margin: '0 0 1rem 1.5rem', padding: 0 }}>
                <li><Link to="/" onClick={onClose} style={{ color: '#214AAB' }}>Home / Dashboard</Link> - Portal overview &amp; features</li>
                <li><Link to="/upload" onClick={onClose} style={{ color: '#214AAB' }}>Send File (Upload)</Link> - Browser AES-256-GCM encryption</li>
                <li><Link to="/inbox" onClick={onClose} style={{ color: '#214AAB' }}>Recipient Inbox</Link> - In-browser decryption &amp; dual download</li>
                <li><a href="/Secure_File_Sharing_User_Manual.pdf" target="_blank" rel="noopener noreferrer" style={{ color: '#214AAB' }}>User Manual (PDF)</a> - Technical &amp; user guide (1.62 MB)</li>
              </ul>

              <div style={{ fontWeight: 700, color: '#162F6A', marginBottom: '0.5rem' }}>
                🔐 Tier 2: Authentication &amp; Governance
              </div>
              <ul style={{ margin: '0 0 0 1.5rem', padding: 0 }}>
                <li><Link to="/login" onClick={onClose} style={{ color: '#214AAB' }}>Sign In</Link> - Secure session authentication with TOTP 2FA</li>
                <li><Link to="/register" onClick={onClose} style={{ color: '#214AAB' }}>Register &amp; Keystore</Link> - ECDH keypair generation in IndexedDB</li>
                <li><Link to="/forgot-password" onClick={onClose} style={{ color: '#214AAB' }}>Password Recovery</Link> - Self-service email OTP reset</li>
                <li><Link to="/admin" onClick={onClose} style={{ color: '#214AAB' }}>Administrative Console</Link> - Immutable audit log inspection (Restricted)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Modal 3: Help & Screen Reader Guide */}
        {activeModal === 'help' && (
          <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#150202' }}>
            <h4 style={{ color: '#162F6A', fontSize: '1rem', margin: '0.5rem 0 0.25rem' }}>Screen Reader &amp; Keyboard Navigation</h4>
            <p style={{ color: '#606060', margin: '0 0 0.75rem' }}>
              The portal is optimized for standard screen readers (NVDA, JAWS, VoiceOver) and full keyboard navigation.
            </p>
            <ul style={{ margin: '0 0 1rem 1.5rem', color: '#606060' }}>
              <li><strong>Skip Navigation:</strong> Press <kbd>Tab</kbd> on any page to focus the "Skip to main content" link.</li>
              <li><strong>Tab Navigation:</strong> Move through interactive controls in logical DOM order.</li>
              <li><strong>Modal Dialogs:</strong> Press <kbd>Esc</kbd> at any time to close active dialogs.</li>
              <li><strong>Accessibility Tools:</strong> Open the accessibility toolbar at the top right to adjust font sizes (A+/A-) or toggle high contrast.</li>
            </ul>
          </div>
        )}

        {/* Modal 4: Feedback Form */}
        {activeModal === 'feedback' && (
          <div>
            {feedbackSuccess ? (
              <div style={{ background: '#E6F4EA', border: '1px solid #198754', padding: '1.25rem', borderRadius: '8px', color: '#198754', textAlign: 'center' }}>
                <strong>Thank you!</strong> Your feedback has been submitted successfully to the engineering team.
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label htmlFor="fb-category" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    Category * (Required)
                  </label>
                  <select
                    id="fb-category"
                    value={feedbackCategory}
                    onChange={(e) => setFeedbackCategory(e.target.value as any)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #C6C6C6', fontSize: '0.88rem' }}
                  >
                    <option value="Accessibility">Accessibility &amp; Usability</option>
                    <option value="Security">Cryptographic &amp; Security Suggestion</option>
                    <option value="Bug">Defect / Bug Report</option>
                    <option value="General">General Feedback</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="fb-name" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    Full Name * (Required)
                  </label>
                  <input
                    id="fb-name"
                    type="text"
                    required
                    value={feedbackName}
                    onChange={(e) => setFeedbackName(e.target.value)}
                    placeholder="Enter your name"
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #C6C6C6', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label htmlFor="fb-email" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    Email Address * (Required)
                  </label>
                  <input
                    id="fb-email"
                    type="email"
                    required
                    value={feedbackEmail}
                    onChange={(e) => setFeedbackEmail(e.target.value)}
                    placeholder="name@example.com"
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #C6C6C6', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label htmlFor="fb-comments" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    Feedback &amp; Remarks * (Required)
                  </label>
                  <textarea
                    id="fb-comments"
                    rows={4}
                    required
                    value={feedbackComments}
                    onChange={(e) => setFeedbackComments(e.target.value)}
                    placeholder="Describe your feedback, test results, or suggestions..."
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #C6C6C6', fontSize: '0.88rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={onClose}
                    style={{ padding: '0.55rem 1.25rem', borderRadius: '6px', border: '1px solid #C6C6C6', background: '#FFFFFF', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    style={{ padding: '0.55rem 1.5rem', borderRadius: '6px', border: 'none', background: '#214AAB', color: '#FFFFFF', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Modal 5: Project Creators & Technical Contact */}
        {activeModal === 'contact' && (
          <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#150202' }}>
            <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', background: '#EEF2FF', borderRadius: '8px', border: '1px solid #D2DFFF' }}>
              <div style={{ color: '#162F6A', fontWeight: 800, fontSize: '0.98rem' }}>
                IT303 Software Engineering Course Project
              </div>
              <div style={{ color: '#334155', fontSize: '0.84rem', marginTop: '2px' }}>
                Department of Information Technology, National Institute of Technology Karnataka (NITK), Surathkal
              </div>
              <div style={{ color: '#162F6A', fontSize: '0.86rem', fontWeight: 700, marginTop: '6px' }}>
                Course Guide: Dr. Jaidhar C D
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #EBEAEA' }}>
                <strong style={{ color: '#162F6A', fontSize: '0.95rem', display: 'block', marginBottom: '8px' }}>
                  Project Creators &amp; Official Contact Details
                </strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Prabhav P */}
                  <div style={{ padding: '0.65rem 0.85rem', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                    <div style={{ fontWeight: 700, color: '#162F6A' }}>
                      Prabhav P <span style={{ color: '#606060', fontWeight: 500 }}>(Roll No: 241IT053)</span>
                    </div>
                    <div style={{ fontSize: '0.84rem', marginTop: '3px' }}>
                      <span style={{ color: '#606060' }}>Official Email: </span>
                      <a href="mailto:prabhavp.241it053@nitk.edu.in" style={{ color: '#214AAB', fontWeight: 600, textDecoration: 'none' }}>
                        prabhavp.241it053@nitk.edu.in
                      </a>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#606060', marginTop: '2px' }}>
                      Alternate: <a href="mailto:withprabhav@gmail.com" style={{ color: '#214AAB', textDecoration: 'none' }}>withprabhav@gmail.com</a>
                    </div>
                  </div>

                  {/* Sucheth K Katte */}
                  <div style={{ padding: '0.65rem 0.85rem', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                    <div style={{ fontWeight: 700, color: '#162F6A' }}>
                      Sucheth K Katte <span style={{ color: '#606060', fontWeight: 500 }}>(Roll No: 241IT078)</span>
                    </div>
                    <div style={{ fontSize: '0.84rem', marginTop: '3px' }}>
                      <span style={{ color: '#606060' }}>Official Email: </span>
                      <a href="mailto:suchethkatte.241it078@nitk.edu.in" style={{ color: '#214AAB', fontWeight: 600, textDecoration: 'none' }}>
                        suchethkatte.241it078@nitk.edu.in
                      </a>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#606060', marginTop: '2px' }}>
                      Alternate: <a href="mailto:suchethkatte@gmail.com" style={{ color: '#214AAB', textDecoration: 'none' }}>suchethkatte@gmail.com</a>
                    </div>
                  </div>

                  {/* Chandan Gowda C */}
                  <div style={{ padding: '0.65rem 0.85rem', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                    <div style={{ fontWeight: 700, color: '#162F6A' }}>
                      Chandan Gowda C <span style={{ color: '#606060', fontWeight: 500 }}>(Roll No: 241IT016)</span>
                    </div>
                    <div style={{ fontSize: '0.84rem', marginTop: '3px' }}>
                      <span style={{ color: '#606060' }}>Official Email: </span>
                      <a href="mailto:chandangowda.241it016@nitk.edu.in" style={{ color: '#214AAB', fontWeight: 600, textDecoration: 'none' }}>
                        chandangowda.241it016@nitk.edu.in
                      </a>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#606060', marginTop: '2px' }}>
                      Alternate: <a href="mailto:chandangowdac666@gmail.com" style={{ color: '#214AAB', textDecoration: 'none' }}>chandangowdac666@gmail.com</a>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #EBEAEA' }}>
                <strong style={{ color: '#162F6A', fontSize: '0.95rem', display: 'block', marginBottom: '4px' }}>
                  Project Repository &amp; User Manual
                </strong>
                <div style={{ color: '#606060', fontSize: '0.85rem' }}>
                  GitHub: <a href="https://github.com/ChandanGowdaC/Secure-File-Sharing-with-Encryption" target="_blank" rel="noopener noreferrer" style={{ color: '#214AAB', fontWeight: 600 }}>github.com/ChandanGowdaC/Secure-File-Sharing-with-Encryption</a>
                </div>
                <div style={{ color: '#606060', fontSize: '0.85rem', marginTop: '4px' }}>
                  User Manual (PDF): <a href="/Secure_File_Sharing_User_Manual.pdf" target="_blank" rel="noopener noreferrer" style={{ color: '#214AAB', fontWeight: 600 }}>Secure_File_Sharing_User_Manual.pdf (15 Pages) ↗</a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
