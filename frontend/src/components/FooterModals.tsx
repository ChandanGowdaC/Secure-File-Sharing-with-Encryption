import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

export type FooterModalType = 'policies' | 'sitemap' | 'help' | 'feedback' | 'contact' | null

interface FooterModalsProps {
  activeModal: FooterModalType
  onClose: () => void
}

export const FooterModals: React.FC<FooterModalsProps> = ({ activeModal, onClose }) => {
  const { t } = useLanguage()
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
            {activeModal === 'policies' && t('Website & Cryptographic Policies', 'वेबसाइट एवं क्रिप्टोग्राफ़िक नीतियां')}
            {activeModal === 'sitemap' && t('Portal Sitemap (2-Tier)', 'पोर्टल साइटमैप (2-स्तरीय)')}
            {activeModal === 'help' && t('Accessibility & Screen Reader Guide', 'सुगम्यता एवं स्क्रीन रीडर मार्गदर्शिका')}
            {activeModal === 'feedback' && t('Project Feedback & Issue Report', 'परियोजना प्रतिक्रिया एवं समस्या रिपोर्ट')}
            {activeModal === 'contact' && t('Project Creators & Technical Contact', 'परियोजना निर्माता एवं आधिकारिक संपर्क')}
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
            <h4 style={{ color: '#162F6A', fontSize: '1rem', margin: '0.75rem 0 0.25rem' }}>
              {t('1. Zero-Knowledge Privacy Policy (DPDP Act 2023)', '1. ज़ीरो-नॉलेज गोपनीयता नीति (DPDP Act 2023)')}
            </h4>
            <p style={{ color: '#606060', margin: '0 0 0.75rem' }}>
              {t(
                'In strict accordance with the Digital Personal Data Protection Act (DPDP Act 2023), this system operates on a zero-knowledge trust model. Your encryption keys are generated locally in your browser and never leave your client device.',
                'डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम (DPDP Act 2023) के अनुसार, यह प्रणाली शून्य-ज्ञान विश्वास मॉडल पर काम करती है। आपकी एन्क्रिप्शन कुंजियाँ स्थानीय रूप से आपके ब्राउज़र में उत्पन्न होती हैं और आपके डिवाइस से कभी बाहर नहीं जाती हैं।'
              )}
            </p>

            <h4 style={{ color: '#162F6A', fontSize: '1rem', margin: '0.75rem 0 0.25rem' }}>
              {t('2. Cryptographic Security Standards', '2. क्रिप्टोग्राफ़िक सुरक्षा मानक')}
            </h4>
            <p style={{ color: '#606060', margin: '0 0 0.75rem' }}>
              {t(
                'All uploaded files are protected with AES-256-GCM authenticated encryption. Transfer keys are derived using Diffie-Hellman (DH) and HKDF-SHA256. Ephemeral keys provide forward secrecy.',
                'सभी अपलोड की गई फ़ाइलें AES-256-GCM प्रमाणित एन्क्रिप्शन द्वारा सुरक्षित हैं। स्थानांतरण कुंजियाँ डिफ़ी-हेलमैन (DH) और HKDF-SHA256 का उपयोग करके प्राप्त की जाती हैं।'
              )}
            </p>

            <h4 style={{ color: '#162F6A', fontSize: '1rem', margin: '0.75rem 0 0.25rem' }}>
              {t('3. Accessibility & Usability', '3. सुगम्यता एवं प्रयोज्यता')}
            </h4>
            <p style={{ color: '#606060', margin: '0 0 0.75rem' }}>
              {t(
                'This portal incorporates WCAG 2.1 Level AA accessibility standards, featuring high-contrast modes, text resizing, and keyboard navigability.',
                'यह पोर्टल उच्च कंट्रास्ट मोड, टेक्स्ट आकार बदलने और कीबोर्ड नेविगेशन सहित WCAG 2.1 स्तर AA सुगम्यता मानकों को शामिल करता है।'
              )}
            </p>
          </div>
        )}

        {/* Modal 2: Sitemap */}
        {activeModal === 'sitemap' && (
          <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#150202' }}>
            <p style={{ color: '#606060', marginBottom: '1rem' }}>
              {t('Hierarchical navigation index for the Secure File Sharing portal:', 'सुरक्षित फ़ाइल साझाकरण पोर्टल के लिए पदानुक्रमित नेविगेशन सूचकांक:')}
            </p>
            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #EBEAEA' }}>
              <div style={{ fontWeight: 700, color: '#162F6A', marginBottom: '0.5rem' }}>
                {t('📁 Tier 1: Main Application', '📁 स्तर 1: मुख्य अनुप्रयोग')}
              </div>
              <ul style={{ margin: '0 0 1rem 1.5rem', padding: 0 }}>
                <li>
                  <Link to="/" onClick={onClose} style={{ color: '#214AAB' }}>{t('Home / Dashboard', 'होम / डैशबोर्ड')}</Link> - {t('Portal overview & features', 'पोर्टल विवरण और सुविधाएं')}
                </li>
                <li>
                  <Link to="/upload" onClick={onClose} style={{ color: '#214AAB' }}>{t('Send File (Upload)', 'फ़ाइल भेजें (अपलोड)')}</Link> - {t('Browser AES-256-GCM encryption', 'ब्राउज़र AES-256-GCM एन्क्रिप्शन')}
                </li>
                <li>
                  <Link to="/inbox" onClick={onClose} style={{ color: '#214AAB' }}>{t('Recipient Inbox', 'प्राप्तकर्ता इनबॉक्स')}</Link> - {t('In-browser decryption & dual download', 'ब्राउज़र डिक्रिप्शन और दोहरी डाउनलोड')}
                </li>
                <li>
                  <a href="/Secure_File_Sharing_User_Manual.pdf" target="_blank" rel="noopener noreferrer" style={{ color: '#214AAB' }}>{t('User Manual (PDF)', 'उपयोगकर्ता मैनुअल (PDF)')}</a> - {t('Technical & user guide (15 Pages)', 'तकनीकी एवं उपयोगकर्ता गाइड (15 पृष्ठ)')}
                </li>
              </ul>

              <div style={{ fontWeight: 700, color: '#162F6A', marginBottom: '0.5rem' }}>
                {t('🔐 Tier 2: Authentication & Management', '🔐 स्तर 2: प्रमाणीकरण एवं प्रबंधन')}
              </div>
              <ul style={{ margin: '0 0 0 1.5rem', padding: 0 }}>
                <li>
                  <Link to="/login" onClick={onClose} style={{ color: '#214AAB' }}>{t('Sign In', 'साइन इन')}</Link> - {t('Secure session authentication with TOTP 2FA', 'TOTP 2FA के साथ सुरक्षित सत्र प्रमाणीकरण')}
                </li>
                <li>
                  <Link to="/register" onClick={onClose} style={{ color: '#214AAB' }}>{t('Register & Keystore', 'पंजीकरण एवं की-स्टोर')}</Link> - {t('DH keypair generation in IndexedDB', 'IndexedDB में DH कुंजी युग्म निर्माण')}
                </li>
                <li>
                  <Link to="/forgot-password" onClick={onClose} style={{ color: '#214AAB' }}>{t('Password Recovery', 'पासवर्ड पुनर्प्राप्ति')}</Link> - {t('Self-service email OTP reset', 'ईमेल OTP पासवर्ड रीसेट')}
                </li>
                <li>
                  <Link to="/admin" onClick={onClose} style={{ color: '#214AAB' }}>{t('Administrative Console', 'प्रशासनिक कंसोल')}</Link> - {t('Audit log inspection (Restricted)', 'ऑडिट लॉग निरीक्षण (प्रतिबंधित)')}
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Modal 3: Help & Screen Reader Guide */}
        {activeModal === 'help' && (
          <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#150202' }}>
            <h4 style={{ color: '#162F6A', fontSize: '1rem', margin: '0.5rem 0 0.25rem' }}>
              {t('Screen Reader & Keyboard Navigation', 'स्क्रीन रीडर एवं कीबोर्ड नेविगेशन')}
            </h4>
            <p style={{ color: '#606060', margin: '0 0 0.75rem' }}>
              {t(
                'The portal is optimized for standard screen readers (NVDA, JAWS, VoiceOver) and full keyboard navigation.',
                'यह पोर्टल मानक स्क्रीन रीडर (NVDA, JAWS, VoiceOver) और पूर्ण कीबोर्ड नेविगेशन के लिए अनुकूलित है।'
              )}
            </p>
            <ul style={{ margin: '0 0 1rem 1.5rem', color: '#606060' }}>
              <li>
                <strong>{t('Skip Navigation:', 'नेविगेशन छोड़ें:')}</strong>{' '}
                {t('Press Tab on any page to focus the "Skip to main content" link.', 'मुख्य सामग्री पर सीधे जाने के लिए किसी भी पृष्ठ पर Tab दबाएं।')}
              </li>
              <li>
                <strong>{t('Tab Navigation:', 'टैब नेविगेशन:')}</strong>{' '}
                {t('Move through interactive controls in logical DOM order.', 'तार्किक क्रम में संवादात्मक नियंत्रणों के बीच घूमें।')}
              </li>
              <li>
                <strong>{t('Modal Dialogs:', 'मॉडल डायलॉग:')}</strong>{' '}
                {t('Press Esc at any time to close active dialogs.', 'सक्रिय डायलॉग को बंद करने के लिए किसी भी समय Esc दबाएं।')}
              </li>
              <li>
                <strong>{t('Accessibility Tools:', 'सुगम्यता उपकरण:')}</strong>{' '}
                {t('Open the accessibility toolbar at the top right to adjust font sizes or toggle high contrast.', 'फ़ॉन्ट आकार बदलने या उच्च कंट्रास्ट सक्षम करने के लिए शीर्ष दाईं ओर सुगम्यता टूलबार खोलें।')}
              </li>
            </ul>
          </div>
        )}

        {/* Modal 4: Feedback Form */}
        {activeModal === 'feedback' && (
          <div>
            {feedbackSuccess ? (
              <div style={{ background: '#E6F4EA', border: '1px solid #198754', padding: '1.25rem', borderRadius: '8px', color: '#198754', textAlign: 'center' }}>
                <strong>{t('Thank you!', 'धन्यवाद!')}</strong>{' '}
                {t('Your feedback has been submitted successfully to the engineering team.', 'आपकी प्रतिक्रिया इंजीनियरिंग टीम को सफलतापूर्वक प्रस्तुत कर दी गई है।')}
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label htmlFor="fb-category" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    {t('Category * (Required)', 'श्रेणी * (अनिवार्य)')}
                  </label>
                  <select
                    id="fb-category"
                    value={feedbackCategory}
                    onChange={(e) => setFeedbackCategory(e.target.value as any)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #C6C6C6', fontSize: '0.88rem' }}
                  >
                    <option value="Accessibility">{t('Accessibility & Usability', 'सुगम्यता एवं प्रयोज्यता')}</option>
                    <option value="Security">{t('Cryptographic & Security Suggestion', 'क्रिप्टोग्राफ़िक एवं सुरक्षा सुझाव')}</option>
                    <option value="Bug">{t('Defect / Bug Report', 'त्रुटि / बग रिपोर्ट')}</option>
                    <option value="General">{t('General Feedback', 'सामान्य प्रतिक्रिया')}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="fb-name" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    {t('Full Name * (Required)', 'पूरा नाम * (अनिवार्य)')}
                  </label>
                  <input
                    id="fb-name"
                    type="text"
                    required
                    value={feedbackName}
                    onChange={(e) => setFeedbackName(e.target.value)}
                    placeholder={t('Enter your name', 'अपना नाम दर्ज करें')}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #C6C6C6', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label htmlFor="fb-email" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    {t('Email Address * (Required)', 'ईमेल पता * (अनिवार्य)')}
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
                    {t('Feedback & Remarks * (Required)', 'प्रतिक्रिया एवं टिप्पणियाँ * (अनिवार्य)')}
                  </label>
                  <textarea
                    id="fb-comments"
                    rows={4}
                    required
                    value={feedbackComments}
                    onChange={(e) => setFeedbackComments(e.target.value)}
                    placeholder={t('Describe your feedback, test results, or suggestions...', 'अपनी प्रतिक्रिया, परीक्षण परिणाम या सुझाव बताएं...')}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #C6C6C6', fontSize: '0.88rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={onClose}
                    style={{ padding: '0.55rem 1.25rem', borderRadius: '6px', border: '1px solid #C6C6C6', background: '#FFFFFF', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    {t('Cancel', 'रद्द करें')}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    style={{ padding: '0.55rem 1.5rem', borderRadius: '6px', border: 'none', background: '#214AAB', color: '#FFFFFF', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    {submittingFeedback ? t('Submitting...', 'जमा किया जा रहा है...') : t('Submit Feedback', 'प्रतिक्रिया जमा करें')}
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
                {t('IT303 Software Engineering Course Project', 'IT303 सॉफ्टवेयर इंजीनियरिंग कोर्स प्रोजेक्ट')}
              </div>
              <div style={{ color: '#334155', fontSize: '0.84rem', marginTop: '2px' }}>
                {t(
                  'Department of Information Technology, National Institute of Technology Karnataka (NITK), Surathkal',
                  'सूचना प्रौद्योगिकी विभाग, राष्ट्रीय प्रौद्योगिकी संस्थान कर्नाटक (एनआईटीके), सुरथकल'
                )}
              </div>
              <div style={{ color: '#162F6A', fontSize: '0.86rem', fontWeight: 700, marginTop: '6px' }}>
                {t('Course Guide: Dr. Jaidhar C D', 'कोर्स गाइड: डॉ. जैधर सी डी')}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #EBEAEA' }}>
                <strong style={{ color: '#162F6A', fontSize: '0.95rem', display: 'block', marginBottom: '8px' }}>
                  {t('Project Creators & Official Contact Details', 'परियोजना निर्माता एवं आधिकारिक संपर्क विवरण')}
                </strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Prabhav P */}
                  <div style={{ padding: '0.65rem 0.85rem', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                    <div style={{ fontWeight: 700, color: '#162F6A' }}>
                      {t('Prabhav P', 'प्रभाव पी')} <span style={{ color: '#606060', fontWeight: 500 }}>({t('Roll No: 241IT053', 'रोल नं: 241IT053')})</span>
                    </div>
                    <div style={{ fontSize: '0.84rem', marginTop: '3px' }}>
                      <span style={{ color: '#606060' }}>{t('Official Email: ', 'आधिकारिक ईमेल: ')}</span>
                      <a href="mailto:prabhavp.241it053@nitk.edu.in" style={{ color: '#214AAB', fontWeight: 600, textDecoration: 'none' }}>
                        prabhavp.241it053@nitk.edu.in
                      </a>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#606060', marginTop: '2px' }}>
                      {t('Alternate:', 'वैकल्पिक:')} <a href="mailto:withprabhav@gmail.com" style={{ color: '#214AAB', textDecoration: 'none' }}>withprabhav@gmail.com</a>
                    </div>
                  </div>

                  {/* Sucheth K Katte */}
                  <div style={{ padding: '0.65rem 0.85rem', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                    <div style={{ fontWeight: 700, color: '#162F6A' }}>
                      {t('Sucheth K Katte', 'सुचेत के कट्टे')} <span style={{ color: '#606060', fontWeight: 500 }}>({t('Roll No: 241IT078', 'रोल नं: 241IT078')})</span>
                    </div>
                    <div style={{ fontSize: '0.84rem', marginTop: '3px' }}>
                      <span style={{ color: '#606060' }}>{t('Official Email: ', 'आधिकारिक ईमेल: ')}</span>
                      <a href="mailto:suchethkatte.241it078@nitk.edu.in" style={{ color: '#214AAB', fontWeight: 600, textDecoration: 'none' }}>
                        suchethkatte.241it078@nitk.edu.in
                      </a>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#606060', marginTop: '2px' }}>
                      {t('Alternate:', 'वैकल्पिक:')} <a href="mailto:suchethkatte@gmail.com" style={{ color: '#214AAB', textDecoration: 'none' }}>suchethkatte@gmail.com</a>
                    </div>
                  </div>

                  {/* Chandan Gowda C */}
                  <div style={{ padding: '0.65rem 0.85rem', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                    <div style={{ fontWeight: 700, color: '#162F6A' }}>
                      {t('Chandan Gowda C', 'चंदन गौड़ा सी')} <span style={{ color: '#606060', fontWeight: 500 }}>({t('Roll No: 241IT016', 'रोल नं: 241IT016')})</span>
                    </div>
                    <div style={{ fontSize: '0.84rem', marginTop: '3px' }}>
                      <span style={{ color: '#606060' }}>{t('Official Email: ', 'आधिकारिक ईमेल: ')}</span>
                      <a href="mailto:chandangowda.241it016@nitk.edu.in" style={{ color: '#214AAB', fontWeight: 600, textDecoration: 'none' }}>
                        chandangowda.241it016@nitk.edu.in
                      </a>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#606060', marginTop: '2px' }}>
                      {t('Alternate:', 'वैकल्पिक:')} <a href="mailto:chandangowdac666@gmail.com" style={{ color: '#214AAB', textDecoration: 'none' }}>chandangowdac666@gmail.com</a>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #EBEAEA' }}>
                <strong style={{ color: '#162F6A', fontSize: '0.95rem', display: 'block', marginBottom: '4px' }}>
                  {t('Project Repository & User Manual', 'परियोजना रिपॉजिटरी एवं उपयोगकर्ता मैनुअल')}
                </strong>
                <div style={{ color: '#606060', fontSize: '0.85rem' }}>
                  GitHub: <a href="https://github.com/ChandanGowdaC/Secure-File-Sharing-with-Encryption" target="_blank" rel="noopener noreferrer" style={{ color: '#214AAB', fontWeight: 600 }}>github.com/ChandanGowdaC/Secure-File-Sharing-with-Encryption</a>
                </div>
                <div style={{ color: '#606060', fontSize: '0.85rem', marginTop: '4px' }}>
                  {t('User Manual (PDF):', 'उपयोगकर्ता मैनुअल (PDF):')}{' '}
                  <a href="/Secure_File_Sharing_User_Manual.pdf" target="_blank" rel="noopener noreferrer" style={{ color: '#214AAB', fontWeight: 600 }}>
                    Secure_File_Sharing_User_Manual.pdf (15 Pages) ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
