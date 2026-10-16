import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { FooterModals, type FooterModalType } from './FooterModals'
import { useLanguage } from '../context/LanguageContext'

export const Footer: React.FC = () => {
  const [activeModal, setActiveModal] = useState<FooterModalType>(null)
  const { isHindi, t } = useLanguage()

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
                {t('Portal Navigation', 'पोर्टल नेविगेशन')}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                <li>
                  <Link to="/" style={{ color: '#214AAB', textDecoration: 'none', fontWeight: 500 }}>
                    › {t('Home Dashboard', 'होम डैशबोर्ड')}
                  </Link>
                </li>
                <li>
                  <Link to="/upload" style={{ color: '#214AAB', textDecoration: 'none', fontWeight: 500 }}>
                    › {t('Send Encrypted File', 'एन्क्रिप्टेड फ़ाइल भेजें')}
                  </Link>
                </li>
                <li>
                  <Link to="/inbox" style={{ color: '#214AAB', textDecoration: 'none', fontWeight: 500 }}>
                    › {t('Recipient Inbox', 'प्राप्तकर्ता इनबॉक्स')}
                  </Link>
                </li>
                <li>
                  <a href="/Secure_File_Sharing_User_Manual.pdf" target="_blank" rel="noopener noreferrer" style={{ color: '#214AAB', textDecoration: 'none', fontWeight: 500 }}>
                    › {t('User Manual (PDF) ↗', 'उपयोगकर्ता मैनुअल (PDF) ↗')}
                  </a>
                </li>
                <li>
                  <Link to="/login" style={{ color: '#214AAB', textDecoration: 'none', fontWeight: 500 }}>
                    › {t('Sign In & 2FA Authentication', 'साइन इन एवं 2FA प्रमाणीकरण')}
                  </Link>
                </li>
                <li>
                  <Link to="/register" style={{ color: '#214AAB', textDecoration: 'none', fontWeight: 500 }}>
                    › {t('Key Vault Registration', 'कुंजी वॉल्ट पंजीकरण')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Cryptographic Features */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#162F6A', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t('Cryptographic Specs', 'क्रिप्टोग्राफ़िक विवरण')}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: '#606060' }}>
                <li>• <strong>AES-256-GCM</strong> {t('Authenticated Encryption', 'प्रमाणित एन्क्रिप्शन')}</li>
                <li>• <strong>DH</strong> {t('Key Exchange', 'कुंजी विनिमय')}</li>
                <li>• <strong>HKDF-SHA256</strong> {t('Ephemeral Derivation', 'क्षणिक व्युत्पत्ति')}</li>
                <li>• <strong>IndexedDB Vault</strong> {t('Non-Exportable Keys', 'स्थानीय सुरक्षित कुंजियां')}</li>
                <li>• <strong>TOTP 2FA</strong> {t('Multi-Factor Protection', 'बहु-कारक सुरक्षा')}</li>
                <li>• <strong>SHA-256</strong> {t('Immutable Forensic Audit Logs', 'अपरिवर्तनीय ऑडिट लॉग्स')}</li>
              </ul>
            </div>

            {/* Column 3: Project Overview */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#162F6A', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t('Project Overview', 'परियोजना विवरण')}
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#606060', marginBottom: '0.85rem', lineHeight: 1.5 }}>
                {t(
                  'Academic & Engineering project implementing browser-based end-to-end encryption for secure file transfers.',
                  'सुरक्षित फ़ाइल स्थानांतरण के लिए ब्राउज़र-आधारित एंड-टू-एंड एन्क्रिप्शन लागू करने वाली शैक्षणिक एवं इंजीनियरिंग पहल।'
                )}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', color: '#606060' }}>
                <li>• {t('Zero server knowledge', 'शून्य सर्वर ज्ञान (Zero Knowledge)')}</li>
                <li>• {t('Client-side key derivation', 'क्लाइंट-साइड कुंजी व्युत्पत्ति')}</li>
                <li>• {t('Web Cryptography API', 'वेब क्रिप्टोग्राफी एपीआई')}</li>
              </ul>
            </div>

            {/* Column 4: Policies & Team Contact */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#162F6A', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t('Policies & Feedback', 'नीतियां एवं प्रतिक्रिया')}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('policies')}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#214AAB', cursor: 'pointer', textAlign: 'left', font: 'inherit', fontWeight: 500 }}
                  >
                    › {t('Website & Privacy Policies', 'वेबसाइट एवं गोपनीयता नीतियां')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('sitemap')}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#214AAB', cursor: 'pointer', textAlign: 'left', font: 'inherit', fontWeight: 500 }}
                  >
                    › {t('Sitemap (2-Tier Hierarchy)', 'साइटमैप (2-स्तरीय)')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('help')}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#214AAB', cursor: 'pointer', textAlign: 'left', font: 'inherit', fontWeight: 500 }}
                  >
                    › {t('Screen Reader & Help Guide', 'स्क्रीन रीडर एवं सहायता मार्गदर्शिका')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('feedback')}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#214AAB', cursor: 'pointer', textAlign: 'left', font: 'inherit', fontWeight: 500 }}
                  >
                    › {t('Submit Feedback / Defect', 'प्रतिक्रिया / त्रुटि रिपोर्ट करें')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('contact')}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#214AAB', cursor: 'pointer', textAlign: 'left', font: 'inherit', fontWeight: 600 }}
                  >
                    › {t('Contact Creators (Official Emails)', 'निर्माताओं से संपर्क करें (आधिकारिक ईमेल)')}
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
                © {new Date().getFullYear()} {t('Secure File Sharing with Client-Side Encryption', 'सुरक्षित फ़ाइल साझाकरण (क्लाइंट-साइड एन्क्रिप्शन)')}
              </p>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#162F6A', fontWeight: 600 }}>
                © {t('IT303 Software Engineering Course Project • NITK Surathkal', 'आईटी303 सॉफ्टवेयर इंजीनियरिंग कोर्स प्रोजेक्ट • एनआईटीके सुरथकल')}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem' }}>
                {t('Developed by', 'विकासकर्ता:')} <strong>{t('Prabhav P', 'प्रभाव पी')} (241IT053)</strong>, <strong>{t('Sucheth K Katte', 'सुचेत के कट्टे')} (241IT078)</strong>, {t('and', 'और')} <strong>{t('Chandan Gowda C', 'चंदन गौड़ा सी')} (241IT016)</strong>
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#606060' }}>
                {t(
                  'Under the Guidance of Dr. Jaidhar C D, Dept. of Information Technology',
                  'डॉ. जैधर सी डी के मार्गदर्शन में, सूचना प्रौद्योगिकी विभाग'
                )}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, color: '#150202' }}>
                {t('Last Updated On:', 'अंतिम अद्यतन:')}{' '}
                <span style={{ color: '#214AAB' }}>{isHindi ? '16 अक्टूबर 2026' : '16 October 2026'}</span>
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                © {new Date().getFullYear()} {t('Software Engineering Project • Zero Plaintext Retention', 'सॉफ्टवेयर इंजीनियरिंग प्रोजेक्ट • शून्य प्लेनटेक्स्ट प्रतिधारण')}
              </div>
            </div>
          </div>

          {/* Dedicated Bottom Copyright Bar */}
          <div
            style={{
              marginTop: '1.25rem',
              paddingTop: '0.85rem',
              borderTop: '1px solid #EBEAEA',
              textAlign: 'center',
              fontSize: '0.78rem',
              color: '#606060',
            }}
          >
            © {new Date().getFullYear()} {t(
              'National Institute of Technology Karnataka (NITK), Surathkal. All rights reserved.',
              'राष्ट्रीय प्रौद्योगिकी संस्थान कर्नाटक (NITK), सुरथकल। सर्वाधिकार सुरक्षित।'
            )}
          </div>
        </div>
      </footer>

      {/* Interactive Modals */}
      <FooterModals activeModal={activeModal} onClose={() => setActiveModal(null)} />
    </>
  )
}
