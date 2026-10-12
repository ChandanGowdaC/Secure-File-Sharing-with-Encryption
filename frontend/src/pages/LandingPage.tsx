import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ProjectEmblem } from '../components/BrandLogos'
import { IconUpload, IconLock, IconDownload, IconView, IconShield } from '../components/LineIcons'

export const LandingPage: React.FC = () => {
  const [selectedPersona, setSelectedPersona] = useState<'sender' | 'recipient' | 'auditor'>('sender')

  const personas = {
    sender: {
      type: 'Sender',
      intent: 'Encrypt files directly in your browser before sending them to any registered user.',
      actionTitle: 'Send File',
      actionLink: '/upload',
      highlights: [
        'Client-side AES-256-GCM encryption ensures plaintext never leaves your device',
        'Automatic recipient public key lookup by username or email',
        'Ephemeral ECDH P-256 keypair generated per transfer',
      ],
      avatar: '📤',
    },
    recipient: {
      type: 'Recipient',
      intent: 'Receive and decrypt incoming files in your browser using your stored private key.',
      actionTitle: 'Inbox',
      actionLink: '/inbox',
      highlights: [
        'Private key stored safely in your browser IndexedDB',
        'Download either the decrypted file or the raw ciphertext (.bin)',
        'Integrity verification with 128-bit authentication tag',
      ],
      avatar: '📥',
    },
    auditor: {
      type: 'Administrator',
      intent: 'View audit logs, system status, and user management.',
      actionTitle: 'Admin Console',
      actionLink: '/admin',
      highlights: [
        'Audit trail tracking logins, transfers, and account events',
        'Zero plaintext is ever stored or logged on the server',
        'User account and transfer management',
      ],
      avatar: '🛡️',
    },
  }

  return (
    <div style={{ width: '100%', fontFamily: "'Noto Sans', sans-serif", color: '#150202', backgroundColor: '#FFFFFF' }}>
      {/* 1. Hero Section (Government Portal Light Style) */}
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
                IT303 Software Engineering Course Project &bull; NITK Surathkal
              </span>
            </div>

            {/* Main Title 1 (DBIM 32px / 2rem, bold) */}
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
              Secure File Sharing with Client-Side Encryption
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
              A Zero-Knowledge Cryptographic File Transfer System engineered with browser-native <strong>AES-256-GCM</strong> and <strong>ECDH Curve P-256</strong> key agreement. Files are encrypted on your local device before transmission — server storage only ever handles ciphertext blobs.
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
                <span style={{ color: '#606060' }}>Developed by:</span>
                <strong style={{ color: '#162F6A' }}>Prabhav P</strong> <span style={{ color: '#606060' }}>(241IT053)</span>,
                <strong style={{ color: '#162F6A' }}>Sucheth K Katte</strong> <span style={{ color: '#606060' }}>(241IT078)</span>, and
                <strong style={{ color: '#162F6A' }}>Chandan Gowda C</strong> <span style={{ color: '#606060' }}>(241IT016)</span>
              </div>
              <div style={{ fontSize: '0.84rem', color: '#606060' }}>
                Under the Guidance of <strong style={{ color: '#162F6A' }}>Dr. Jaidhar C D</strong> &bull; Department of Information Technology, NITK Surathkal
              </div>
            </div>

            {/* Primary Action Buttons (Max 3 words, Figure 19) */}
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
                <span>Send Encrypted File</span>
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
                <span>Access Inbox</span>
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
                <span>View User Manual (PDF)</span>
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
              Security Architecture
            </span>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#162F6A', margin: '0.35rem 0 0' }}>
              Core Cryptographic Capabilities
            </h2>
            <p style={{ color: '#606060', fontSize: '0.95rem', margin: '0.5rem 0 0' }}>
              Built according to NIST cryptographic guidelines with client-side isolation
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
                Zero Server Trust
              </h3>
              <p style={{ color: '#606060', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
                Private keys are created in the browser and stored exclusively in IndexedDB. Plaintext files never cross network boundaries.
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
                AES-256-GCM + ECDH
              </h3>
              <p style={{ color: '#606060', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
                Authenticated encryption with a 128-bit integrity tag and forward-secret ephemeral HKDF-SHA256 key agreement.
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
                Dual Download Retention
              </h3>
              <p style={{ color: '#606060', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
                Transfers remain available in the inbox after delivery so users can download either decrypted plaintext or raw ciphertext (.bin).
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
                Immutable Audit Trail
              </h3>
              <p style={{ color: '#606060', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
                Tamper-resistant audit logs track system authentication, transfer dispatch, and deletion operations with zero plaintext leakage.
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
              Operational Workflow
            </span>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#162F6A', margin: '0.35rem 0 0' }}>
              How End-to-End Encryption Works
            </h2>
            <p style={{ color: '#606060', fontSize: '0.95rem', margin: '0.5rem 0 0' }}>
              A 3-step zero-knowledge lifecycle from client dispatch to recipient decryption
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
                  Client-Side Encryption
                </h3>
              </div>
              <p style={{ color: '#606060', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                Sender selects a file and specifies the recipient. The browser queries the recipient&apos;s public key, generates an ephemeral ECDH keypair, derives a 256-bit key via HKDF-SHA256, and encrypts the file locally using AES-256-GCM.
              </p>
            </div>

            {/* Step 2 */}
            <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '10px', border: '1px solid #EBEAEA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#214AAB', color: '#FFFFFF', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                  2
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#162F6A', margin: 0 }}>
                  Zero-Knowledge Dispatch
                </h3>
              </div>
              <p style={{ color: '#606060', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                Only the ciphertext blob, IV nonce, ephemeral public key, and authentication tag are uploaded to the server over TLS. The server storage cannot inspect, decrypt, or tamper with the payload.
              </p>
            </div>

            {/* Step 3 */}
            <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '10px', border: '1px solid #EBEAEA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#214AAB', color: '#FFFFFF', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                  3
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#162F6A', margin: 0 }}>
                  In-Browser Decryption
                </h3>
              </div>
              <p style={{ color: '#606060', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                The recipient accesses their inbox, fetches the ciphertext payload, retrieves their long-term private key from IndexedDB, derives the transfer key, and decrypts the file locally in the browser.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive User Personas (DBIM Section A.2) */}
      <section style={{ padding: '3.5rem 1.5rem', backgroundColor: '#FFFFFF' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#214AAB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              User Journeys
            </span>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#162F6A', margin: '0.35rem 0 0' }}>
              Tailored Portals for Every Role
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
                Complete Project Documentation
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#162F6A', margin: '0 0 0.5rem' }}>
                Secure File Sharing User Manual (PDF)
              </h3>
              <p style={{ color: '#606060', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                Includes comprehensive end-to-end user manuals, annotated application screenshots, cryptographic flowcharts, 2FA setup guides, and administrative audit inspection procedures.
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
                <span>Download Manual (PDF)</span>
                <span>↓</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
