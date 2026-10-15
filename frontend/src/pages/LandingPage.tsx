import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ProjectEmblem } from '../components/BrandLogos'
import { IconUpload, IconLock, IconDownload, IconView, IconShield } from '../components/LineIcons'
import { useLanguage } from '../context/LanguageContext'

export const LandingPage: React.FC = () => {
  const { isHindi, t } = useLanguage()
  const [selectedPersona, setSelectedPersona] = useState<'sender' | 'recipient' | 'auditor'>('sender')

  const personas = {
    sender: {
      type: t('Sender', 'प्रेषक'),
      intent: t(
        'Encrypt files directly in your browser before sending them to any registered user.',
        'किसी भी पंजीकृत उपयोगकर्ता को भेजने से पहले सीधे अपने ब्राउज़र में फ़ाइलों को एन्क्रिप्ट करें।'
      ),
      actionTitle: t('Send File', 'फ़ाइल भेजें'),
      actionLink: '/upload',
      highlights: isHindi
        ? [
            'क्लाइंट-साइड AES-256-GCM एन्क्रिप्शन सुनिश्चित करता है कि प्लेनटेक्स्ट कभी आपके डिवाइस से बाहर न जाए',
            'उपयोगकर्ता नाम या ईमेल द्वारा स्वचालित प्राप्तकर्ता सार्वजनिक कुंजी खोज',
            'प्रति स्थानांतरण क्षणिक DH कुंजी युग्म उत्पन्न होता है',
          ]
        : [
            'Client-side AES-256-GCM encryption ensures plaintext never leaves your device',
            'Automatic recipient public key lookup by username or email',
            'Ephemeral DH keypair generated per transfer',
          ],
      avatar: '📤',
    },
    recipient: {
      type: t('Recipient', 'प्राप्तकर्ता'),
      intent: t(
        'Receive and decrypt incoming files in your browser using your stored private key.',
        'अपनी संग्रहीत निजी कुंजी का उपयोग करके अपने ब्राउज़र में आने वाली फ़ाइलों को प्राप्त और डिक्रिप्ट करें।'
      ),
      actionTitle: t('Inbox', 'इनबॉक्स'),
      actionLink: '/inbox',
      highlights: isHindi
        ? [
            'निजी कुंजी आपके ब्राउज़र IndexedDB में सुरक्षित रूप से संग्रहीत है',
            'डिक्रिप्ट की गई फ़ाइल या रॉ सिफ़रटेक्स्ट (.bin) डाउनलोड करें',
            '128-बिट प्रमाणीकरण टैग के साथ अखंडता सत्यापन',
          ]
        : [
            'Private key stored safely in your browser IndexedDB',
            'Download either the decrypted file or the raw ciphertext (.bin)',
            'Integrity verification with 128-bit authentication tag',
          ],
      avatar: '📥',
    },
    auditor: {
      type: t('Administrator', 'प्रशासक'),
      intent: t(
        'View audit logs, system status, and user management.',
        'ऑडिट लॉग, सिस्टम स्थिति और उपयोगकर्ता प्रबंधन देखें।'
      ),
      actionTitle: t('Admin Console', 'एडमिन कंसोल'),
      actionLink: '/admin',
      highlights: isHindi
        ? [
            'लॉगिन, स्थानांतरण और खाता घटनाओं को ट्रैक करने वाला ऑडिट ट्रेल',
            'सर्वर पर कभी भी कोई प्लेनटेक्स्ट संग्रहीत या लॉग नहीं किया जाता',
            'उपयोगकर्ता खाता और स्थानांतरण प्रबंधन',
          ]
        : [
            'Audit trail tracking logins, transfers, and account events',
            'Zero plaintext is ever stored or logged on the server',
            'User account and transfer management',
          ],
      avatar: '🛡️',
    },
  }

  return (
    <div style={{ width: '100%', fontFamily: "'Noto Sans', sans-serif", color: '#150202', backgroundColor: '#FFFFFF' }}>
      {/* 1. Hero Section */}
      <section
        style={{
          background: 'linear-gradient(180deg, #F0F4FF 0%, #FFFFFF 100%)',
          borderBottom: '1px solid #EBEAEA',
          padding: '3.5rem 1.5rem 3rem',
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.25rem' }}>
            {/* Project Category Tag */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#FFFFFF',
                border: '1px solid #D2DFFF',
                padding: '0.4rem 1rem',
                borderRadius: '20px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#162F6A', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {t(
                  'IT303 Software Engineering Course Project • NITK Surathkal',
                  'आईटी303 सॉफ्टवेयर इंजीनियरिंग कोर्स प्रोजेक्ट • एनआईटीके सुरथकल'
                )}
              </span>
            </div>

            {/* Main Title */}
            <h1
              style={{
                fontSize: 'clamp(1.9rem, 4vw, 2.75rem)',
                fontWeight: 800,
                color: '#162F6A',
                margin: 0,
                lineHeight: 1.25,
                maxWidth: '900px',
              }}
            >
              {t(
                'Secure File Sharing with Client-Side Encryption',
                'सुरक्षित फ़ाइल साझाकरण (क्लाइंट-साइड एन्क्रिप्शन)'
              )}
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: '1.1rem',
                color: '#334155',
                lineHeight: 1.6,
                maxWidth: '820px',
                margin: 0,
              }}
            >
              {isHindi ? (
                <>
                  ब्राउज़र-नेटिव <strong>AES-256-GCM</strong> और <strong>डिफ़ी-हेलमैन (DH)</strong> कुंजी समझौते के साथ निर्मित ज़ीरो-नॉलेज क्रिप्टोग्राफ़िक फ़ाइल स्थानांतरण प्रणाली। ट्रांसमिशन से पहले फ़ाइलें आपके स्थानीय डिवाइस पर एन्क्रिप्ट की जाती हैं — सर्वर स्टोरेज केवल सिफ़रटेक्स्ट ब्लॉब्स को संभालता है।
                </>
              ) : (
                <>
                  A Zero-Knowledge Cryptographic File Transfer System engineered with browser-native <strong>AES-256-GCM</strong> and <strong>Diffie-Hellman (DH)</strong> key agreement. Files are encrypted on your local device before transmission — server storage only ever handles ciphertext blobs.
                </>
              )}
            </p>

            {/* Authorship & Academic Guidance */}
            <div
              style={{
                fontSize: '0.9rem',
                color: '#334155',
                background: '#FFFFFF',
                border: '1px solid #EBEAEA',
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span style={{ color: '#606060' }}>{t('Developed by:', 'विकासकर्ता:')}</span>
                <strong style={{ color: '#162F6A' }}>{t('Prabhav P', 'प्रभाव पी')}</strong> <span style={{ color: '#606060' }}>(241IT053)</span>,
                <strong style={{ color: '#162F6A' }}>{t('Sucheth K Katte', 'सुचेत के कट्टे')}</strong> <span style={{ color: '#606060' }}>(241IT078)</span>,{' '}
                {t('and', 'और')}{' '}
                <strong style={{ color: '#162F6A' }}>{t('Chandan Gowda C', 'चंदन गौड़ा सी')}</strong> <span style={{ color: '#606060' }}>(241IT016)</span>
              </div>
              <div style={{ fontSize: '0.84rem', color: '#606060' }}>
                {t(
                  'Under the Guidance of Dr. Jaidhar C D • Department of Information Technology, NITK Surathkal',
                  'डॉ. जैधर सी डी के मार्गदर्शन में • सूचना प्रौद्योगिकी विभाग, एनआईटीके सुरथकल'
                )}
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
              <Link
                to="/upload"
                style={{
                  backgroundColor: '#214AAB',
                  color: '#FFFFFF',
                  padding: '0.75rem 1.75rem',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(33, 74, 171, 0.25)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <IconUpload size={20} color="#FFFFFF" />
                <span>{t('Send Encrypted File', 'एन्क्रिप्टेड फ़ाइल भेजें')}</span>
              </Link>

              <Link
                to="/inbox"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#162F6A',
                  border: '1px solid #CBD5E1',
                  padding: '0.75rem 1.75rem',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <IconDownload size={20} color="#162F6A" />
                <span>{t('Access Inbox', 'इनबॉक्स देखें')}</span>
              </Link>

              <a
                href="/Secure_File_Sharing_User_Manual.pdf"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  backgroundColor: '#F8FAFC',
                  color: '#150202',
                  border: '1px solid #C6C6C6',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <IconView size={20} color="#606060" />
                <span>{t('View User Manual (PDF)', 'उपयोगकर्ता मैनुअल (PDF)')}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Key Cryptographic & Architecture Pillars */}
      <section style={{ padding: '3.5rem 1.5rem', backgroundColor: '#FFFFFF' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#214AAB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('Security Architecture', 'सुरक्षा वास्तुकला')}
            </span>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#162F6A', margin: '0.35rem 0 0' }}>
              {t('Core Cryptographic Capabilities', 'मुख्य क्रिप्टोग्राफ़िक क्षमताएं')}
            </h2>
            <p style={{ color: '#606060', fontSize: '0.95rem', margin: '0.5rem 0 0' }}>
              {t(
                'Built according to NIST cryptographic guidelines with client-side isolation',
                'क्लाइंट-साइड अलगाव के साथ NIST क्रिप्टोग्राफ़िक दिशानिर्देशों के अनुसार निर्मित'
              )}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* Card 1 */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EBEAEA',
                borderRadius: '10px',
                padding: '1.75rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <IconLock size={24} color="#214AAB" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#162F6A', margin: '0 0 0.5rem' }}>
                {t('Zero Server Trust', 'शून्य सर्वर विश्वास (Zero Trust)')}
              </h3>
              <p style={{ color: '#606060', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
                {t(
                  'Private keys are created in the browser and stored exclusively in IndexedDB. Plaintext files never cross network boundaries.',
                  'निजी कुंजियां ब्राउज़र में बनाई जाती हैं और विशेष रूप से IndexedDB में संग्रहीत की जाती हैं। प्लेनटेक्स्ट फ़ाइलें कभी भी नेटवर्क सीमाओं को पार नहीं करती हैं।'
                )}
              </p>
            </div>

            {/* Card 2 */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EBEAEA',
                borderRadius: '10px',
                padding: '1.75rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <IconShield size={24} color="#166534" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#162F6A', margin: '0 0 0.5rem' }}>
                AES-256-GCM + DH
              </h3>
              <p style={{ color: '#606060', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
                {t(
                  'Authenticated encryption with a 128-bit integrity tag and forward-secret ephemeral HKDF-SHA256 key agreement.',
                  '128-बिट अखंडता टैग और फॉरवर्ड-सीक्रेट क्षणिक HKDF-SHA256 कुंजी समझौते के साथ प्रमाणित एन्क्रिप्शन।'
                )}
              </p>
            </div>

            {/* Card 3 */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EBEAEA',
                borderRadius: '10px',
                padding: '1.75rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <IconDownload size={24} color="#916100" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#162F6A', margin: '0 0 0.5rem' }}>
                {t('Dual Download Retention', 'दोहरी डाउनलोड प्रतिधारण')}
              </h3>
              <p style={{ color: '#606060', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
                {t(
                  'Transfers remain available in the inbox after delivery so users can download either decrypted plaintext or raw ciphertext (.bin).',
                  'डिलिवरी के बाद स्थानांतरण इनबॉक्स में उपलब्ध रहता है ताकि उपयोगकर्ता डिक्रिप्टेड प्लेनटेक्स्ट या रॉ सिफ़रटेक्स्ट (.bin) डाउनलोड कर सकें।'
                )}
              </p>
            </div>

            {/* Card 4 */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EBEAEA',
                borderRadius: '10px',
                padding: '1.75rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <ProjectEmblem size={32} color="#162F6A" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#162F6A', margin: '0 0 0.5rem' }}>
                {t('Immutable Audit Trail', 'अपरिवर्तनीय ऑडिट ट्रेल')}
              </h3>
              <p style={{ color: '#606060', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
                {t(
                  'Tamper-resistant audit logs track system authentication, transfer dispatch, and deletion operations with zero plaintext leakage.',
                  'छेड़छाड़-प्रतिरोधी ऑडिट लॉग शून्य प्लेनटेक्स्ट रिसाव के साथ सिस्टम प्रमाणीकरण, स्थानांतरण प्रेषण और विलोपन कार्यों को ट्रैक करते हैं।'
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. How It Works (3 Steps Workflow) */}
      <section style={{ padding: '3.5rem 1.5rem', backgroundColor: '#F8FAFC', borderTop: '1px solid #EBEAEA', borderBottom: '1px solid #EBEAEA' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#214AAB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('Operational Workflow', 'परिचालन कार्यप्रवाह')}
            </span>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#162F6A', margin: '0.35rem 0 0' }}>
              {t('How End-to-End Encryption Works', 'एंड-टू-एंड एन्क्रिप्शन कैसे काम करता है')}
            </h2>
            <p style={{ color: '#606060', fontSize: '0.95rem', margin: '0.5rem 0 0' }}>
              {t(
                'A 3-step zero-knowledge lifecycle from client dispatch to recipient decryption',
                'क्लाइंट प्रेषण से लेकर प्राप्तकर्ता डिक्रिप्शन तक 3-चरणीय ज़ीरो-नॉलेज जीवनचक्र'
              )}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* Step 1 */}
            <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '10px', border: '1px solid #EBEAEA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#214AAB', color: '#FFFFFF', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                  1
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#162F6A', margin: 0 }}>
                  {t('Client-Side Encryption', 'क्लाइंट-साइड एन्क्रिप्शन')}
                </h3>
              </div>
              <p style={{ color: '#606060', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                {t(
                  "Sender selects a file and specifies the recipient. The browser queries the recipient's public key, generates an ephemeral DH keypair, derives a 256-bit key via HKDF-SHA256, and encrypts the file locally using AES-256-GCM.",
                  'प्रेषक एक फ़ाइल चुनता है और प्राप्तकर्ता निर्दिष्ट करता है। ब्राउज़र प्राप्तकर्ता की सार्वजनिक कुंजी देखता है, एक क्षणिक DH कुंजी युग्म उत्पन्न करता है, HKDF-SHA256 के माध्यम से 256-बिट कुंजी व्युत्पन्न करता है, और AES-256-GCM का उपयोग करके फ़ाइल को स्थानीय रूप से एन्क्रिप्ट करता है।'
                )}
              </p>
            </div>

            {/* Step 2 */}
            <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '10px', border: '1px solid #EBEAEA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#214AAB', color: '#FFFFFF', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                  2
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#162F6A', margin: 0 }}>
                  {t('Zero-Knowledge Dispatch', 'ज़ीरो-नॉलेज प्रेषण')}
                </h3>
              </div>
              <p style={{ color: '#606060', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                {t(
                  'Only the ciphertext blob, IV nonce, ephemeral public key, and authentication tag are uploaded to the server over TLS. The server storage cannot inspect, decrypt, or tamper with the payload.',
                  'केवल सिफ़रटेक्स्ट ब्लॉब, IV नॉन्स, क्षणिक सार्वजनिक कुंजी और प्रमाणीकरण टैग को TLS पर सर्वर पर अपलोड किया जाता है। सर्वर स्टोरेज पेलोड का निरीक्षण, डिक्रिप्ट या छेड़छाड़ नहीं कर सकता।'
                )}
              </p>
            </div>

            {/* Step 3 */}
            <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '10px', border: '1px solid #EBEAEA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#214AAB', color: '#FFFFFF', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                  3
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#162F6A', margin: 0 }}>
                  {t('In-Browser Decryption', 'ब्राउज़र में डिक्रिप्शन')}
                </h3>
              </div>
              <p style={{ color: '#606060', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                {t(
                  'The recipient accesses their inbox, fetches the ciphertext payload, retrieves their long-term private key from IndexedDB, derives the transfer key, and decrypts the file locally in the browser.',
                  'प्राप्तकर्ता अपने इनबॉक्स तक पहुंचता है, सिफ़रटेक्स्ट पेलोड प्राप्त करता है, IndexedDB से अपनी दीर्घकालिक निजी कुंजी प्राप्त करता है, स्थानांतरण कुंजी प्राप्त करता है, और ब्राउज़र में स्थानीय रूप से फ़ाइल को डिक्रिप्ट करता है।'
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive User Personas */}
      <section style={{ padding: '3.5rem 1.5rem', backgroundColor: '#FFFFFF' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#214AAB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('User Journeys', 'उपयोगकर्ता यात्राएं')}
            </span>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#162F6A', margin: '0.35rem 0 0' }}>
              {t('Tailored Portals for Every Role', 'प्रत्येक भूमिका के लिए विशेष पोर्टल')}
            </h2>
          </div>

          {/* Persona Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {(['sender', 'recipient', 'auditor'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedPersona(key)}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '6px',
                  border: selectedPersona === key ? '2px solid #214AAB' : '1px solid #C6C6C6',
                  backgroundColor: selectedPersona === key ? '#EEF2FF' : '#FFFFFF',
                  color: selectedPersona === key ? '#214AAB' : '#150202',
                  fontSize: '0.9rem',
                  fontWeight: selectedPersona === key ? 700 : 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{personas[key].avatar}</span>
                <span>{personas[key].type}</span>
              </button>
            ))}
          </div>

          {/* Active Persona Card */}
          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #EBEAEA',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#162F6A', margin: 0 }}>
                  {personas[selectedPersona].type}
                </h3>
                <p style={{ color: '#606060', fontSize: '0.92rem', margin: '4px 0 0' }}>
                  {personas[selectedPersona].intent}
                </p>
              </div>
              <Link
                to={personas[selectedPersona].actionLink}
                style={{
                  backgroundColor: '#214AAB',
                  color: '#FFFFFF',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                }}
              >
                {personas[selectedPersona].actionTitle} &rarr;
              </Link>
            </div>

            <ul style={{ margin: '1rem 0 0 1.25rem', padding: 0, color: '#334155', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {personas[selectedPersona].highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 5. User Manual & Documentation Banner */}
      <section style={{ padding: '3rem 1.5rem', backgroundColor: '#F0F4FF', borderTop: '1px solid #D2DFFF' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #D2DFFF',
              borderRadius: '12px',
              padding: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1.5rem',
              flexWrap: 'wrap',
              boxShadow: '0 4px 16px rgba(33, 74, 171, 0.08)',
            }}
          >
            <div style={{ flex: '1 1 400px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#214AAB', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                {t('Complete Project Documentation', 'संपूर्ण परियोजना दस्तावेज़ीकरण')}
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#162F6A', margin: '0 0 0.5rem' }}>
                {t('Secure File Sharing User Manual (PDF)', 'सुरक्षित फ़ाइल साझाकरण उपयोगकर्ता मैनुअल (PDF)')}
              </h3>
              <p style={{ color: '#606060', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                {t(
                  'Includes comprehensive end-to-end user manuals, annotated application screenshots, cryptographic flowcharts, 2FA setup guides, and administrative audit inspection procedures.',
                  'व्यापक एंड-टू-एंड उपयोगकर्ता मैनुअल, एनोटेटेड एप्लिकेशन स्क्रीनशॉट, क्रिप्टोग्राफ़िक फ़्लोचार्ट, 2FA सेटअप गाइड और प्रशासनिक ऑडिट निरीक्षण प्रक्रियाएं शामिल हैं।'
                )}
              </p>
            </div>
            <div>
              <a
                href="/Secure_File_Sharing_User_Manual.pdf"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  backgroundColor: '#214AAB',
                  color: '#FFFFFF',
                  padding: '0.75rem 1.75rem',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(33, 74, 171, 0.25)',
                }}
              >
                <span>{t('Download Manual (PDF)', 'मैनुअल डाउनलोड करें (PDF)')}</span>
                <span>↓</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
