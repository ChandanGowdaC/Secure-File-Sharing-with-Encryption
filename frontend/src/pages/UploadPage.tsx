import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { generateEphemeralKeyPair } from '../crypto/keypair'
import { deriveTransferKey } from '../crypto/hkdf'
import { encryptFile } from '../crypto/aes-gcm'
import { IconUpload, IconLock } from '../components/LineIcons'
import { useLanguage } from '../context/LanguageContext'

interface RegisteredUser {
  username: string
  displayName: string
  roleEn: string
  roleHi: string
  email: string
  badgeEn: string
  badgeHi: string
}

const REGISTERED_USERS: RegisteredUser[] = [
  {
    username: 'demo',
    displayName: 'Demo User',
    roleEn: 'Evaluation & Test User',
    roleHi: 'मूल्यांकन एवं परीक्षण खाता',
    email: 'demo@sfs.gov.in',
    badgeEn: 'Demo Account',
    badgeHi: 'डेमो खाता',
  },
  {
    username: 'chandan',
    displayName: 'Chandan Gowda C',
    roleEn: 'Project Developer (241IT016)',
    roleHi: 'परियोजना विकासकर्ता (241IT016)',
    email: 'chandangowdac666@gmail.com',
    badgeEn: 'Verified Member',
    badgeHi: 'सत्यापित सदस्य',
  },
  {
    username: 'withprabhav',
    displayName: 'Prabhav P',
    roleEn: 'Project Developer (241IT053)',
    roleHi: 'परियोजना विकासकर्ता (241IT053)',
    email: 'prabhav.241it053@nitk.edu.in',
    badgeEn: 'Verified Member',
    badgeHi: 'सत्यापित सदस्य',
  },
]

const MAX_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024
const SUPPORTED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'jpg', 'jpeg', 'png',
]
const FILE_INPUT_ACCEPT = SUPPORTED_EXTENSIONS.map(extension => `.${extension}`).join(',')
const SUPPORTED_FORMATS_LABEL = 'PDF, DOCX, XLSX, PPTX, TXT, CSV, JPG, PNG'

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

export const UploadPage: React.FC = () => {
  const { t } = useLanguage()
  const [receiverUsername, setReceiverUsername] = useState('')
  const [showUsersModal, setShowUsersModal] = useState(false)
  const [userFilter, setUserFilter] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastTiming, setLastTiming] = useState<{
    encryptionTimeMs: number
    filename: string
    fileSize: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [recipientStatus, setRecipientStatus] = useState<{
    checking: boolean
    hasActive: boolean
    canSend: boolean
    message?: string | null
    existingFilename?: string | null
  } | null>(null)

  useEffect(() => {
    const trimmed = receiverUsername.trim()
    if (!trimmed) {
      setRecipientStatus(null)
      return
    }

    const timer = setTimeout(async () => {
      try {
        setRecipientStatus(prev => prev ? { ...prev, checking: true } : { checking: true, hasActive: false, canSend: true })
        const res = await api.transfers.checkRecipient(trimmed)
        setRecipientStatus({
          checking: false,
          hasActive: res.has_active_transfer,
          canSend: res.can_send,
          message: res.message,
          existingFilename: res.existing_filename,
        })
      } catch {
        // If recipient doesn't exist yet or check fails, reset check
        setRecipientStatus(null)
      }
    }, 450)

    return () => clearTimeout(timer)
  }, [receiverUsername])

  const validateAndSetFile = (selectedFile: File) => {
    setError(null)
    setStatusMsg(null)
    const extension = selectedFile.name.split('.').pop()?.toLowerCase()
    if (!extension || !SUPPORTED_EXTENSIONS.includes(extension)) {
      setFile(null)
      setError(
        t(
          `"${selectedFile.name}" is not supported. Supported: ${SUPPORTED_FORMATS_LABEL}`,
          `"${selectedFile.name}" समर्थित नहीं है। समर्थित प्रारूप: ${SUPPORTED_FORMATS_LABEL}`
        )
      )
      return
    }
    if (selectedFile.size > MAX_UPLOAD_SIZE_BYTES) {
      setFile(null)
      setError(
        t(
          `File size is ${formatFileSize(selectedFile.size)}. Maximum allowed size is 100 MB.`,
          `फ़ाइल का आकार ${formatFileSize(selectedFile.size)} है। अधिकतम अनुमत आकार 100 MB है।`
        )
      )
      return
    }
    setFile(selectedFile)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleClearFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !receiverUsername.trim()) return

    setLoading(true)
    setError(null)
    setStatusMsg(t('Step 1/5: Checking recipient transfer eligibility...', 'चरण 1/5: प्राप्तकर्ता स्थानांतरण पात्रता जांची जा रही है...'))

    try {
      // 0. Pre-flight policy check: sender can have max 1 active file per recipient
      const checkRes = await api.transfers.checkRecipient(receiverUsername.trim())
      if (!checkRes.can_send) {
        setRecipientStatus({
          checking: false,
          hasActive: checkRes.has_active_transfer,
          canSend: false,
          message: checkRes.message,
          existingFilename: checkRes.existing_filename,
        })
        throw new Error(
          checkRes.message ||
            t(
              `You already have an active file sent to "${receiverUsername.trim()}". You can only send another file once the recipient deletes the existing file from the server.`,
              `आप पहले ही "${receiverUsername.trim()}" को एक सक्रिय फ़ाइल भेज चुके हैं। आप दूसरी फ़ाइल तभी भेज सकते हैं जब प्राप्तकर्ता मौजूदा फ़ाइल को सर्वर से हटा दे।`
            )
        )
      }

      // 1. Fetch receiver's long-term public key
      setStatusMsg(t('Step 2/5: Looking up receiver public key...', 'चरण 2/5: प्राप्तकर्ता की सार्वजनिक कुंजी खोजी जा रही है...'))
      const keyRes = await api.auth.lookupPublicKey({ username: receiverUsername.trim() })
      if (!keyRes.found || !keyRes.public_key) {
        throw new Error(
          t(
            `Receiver "${receiverUsername.trim()}" not found or has no public key registered.`,
            `प्राप्तकर्ता "${receiverUsername.trim()}" नहीं मिला या कोई सार्वजनिक कुंजी पंजीकृत नहीं है।`
          )
        )
      }

      setStatusMsg(
        t(
          'Step 3/5: Generating ephemeral DH keypair & deriving AES-256-GCM key...',
          'चरण 3/5: क्षणिक DH कुंजी युग्म उत्पन्न करना और AES-256-GCM कुंजी व्युत्पन्न करना...'
        )
      )
      // 2. Generate ephemeral key pair
      const ephemeralKeypair = await generateEphemeralKeyPair()

      setStatusMsg(
        t(
          'Step 4/5: Encrypting file locally with AES-256-GCM...',
          'चरण 4/5: AES-256-GCM के साथ स्थानीय रूप से फ़ाइल एन्क्रिप्ट की जा रही है...'
        )
      )
      const arrayBuffer = await file.arrayBuffer()

      // Measure client-side cryptographic encryption duration
      // (HKDF-SHA256 session key derivation + AES-256-GCM authenticated encryption)
      const t0 = performance.now()
      const transferKey = await deriveTransferKey(
        ephemeralKeypair.privateKey,
        keyRes.public_key
      )
      const { ciphertext, nonce, authTag } = await encryptFile(arrayBuffer, transferKey)
      const t1 = performance.now()
      const encryptionDurationMs = Math.round((t1 - t0) * 100) / 100

      setStatusMsg(
        t(
          'Step 5/5: Uploading ciphertext blob to secure queue...',
          'चरण 5/5: सिफ़रटेक्स्ट ब्लॉब सुरक्षित कतार में अपलोड किया जा रहा है...'
        )
      )
      const currentFileName = file.name
      const currentFileSize = file.size

      const uploadRes = await api.transfers.upload({
        receiver_username: receiverUsername.trim(),
        ciphertext,
        nonce,
        auth_tag: authTag,
        sender_ephemeral_public_key: ephemeralKeypair.publicKey,
        original_filename: currentFileName,
        file_size_bytes: currentFileSize,
        encryption_time_ms: encryptionDurationMs,
      })

      setLastTiming({
        encryptionTimeMs: encryptionDurationMs,
        filename: currentFileName,
        fileSize: currentFileSize,
      })

      setStatusMsg(
        t(
          `Success! Encrypted file "${currentFileName}" queued for recipient. Transfer ID: ${uploadRes.transfer_id}`,
          `सफलता! एन्क्रिप्टेड फ़ाइल "${currentFileName}" प्राप्तकर्ता के लिए कतारबद्ध है। स्थानांतरण आईडी: ${uploadRes.transfer_id}`
        )
      )
      setFile(null)
      setReceiverUsername('')
      setRecipientStatus(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: any) {
      setError(err.message || t('Encryption or upload failed.', 'एन्क्रिप्शन या अपलोड विफल रहा।'))
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = REGISTERED_USERS.filter(
    u =>
      u.username.toLowerCase().includes(userFilter.toLowerCase()) ||
      u.displayName.toLowerCase().includes(userFilter.toLowerCase()) ||
      u.email.toLowerCase().includes(userFilter.toLowerCase()) ||
      u.roleEn.toLowerCase().includes(userFilter.toLowerCase())
  )

  const isFormValid = !!file && receiverUsername.trim().length > 0 && !recipientStatus?.hasActive

  return (
    <div className="page-shell page-shell-narrow" style={{ padding: '1.5rem 1rem' }}>
      {/* Breadcrumb Trail */}
      <nav aria-label="Breadcrumb" style={{ fontSize: '0.82rem', color: '#606060', marginBottom: '1rem' }}>
        <Link to="/" style={{ color: '#214AAB', textDecoration: 'none' }}>{t('Home', 'होम')}</Link>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span style={{ color: '#150202', fontWeight: 600 }}>{t('Encrypted Upload', 'एन्क्रिप्टेड अपलोड')}</span>
      </nav>

      <div className="glass-card" style={{ background: '#FFFFFF', border: '1px solid #EBEAEA', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '12px',
              background: '#D2DFFF',
              color: '#162F6A',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.75rem',
            }}
          >
            <IconUpload size={32} color="#162F6A" />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#162F6A', margin: '0 0 0.35rem' }}>
            {t('Send Encrypted File', 'एन्क्रिप्टेड फ़ाइल भेजें')}
          </h1>
          <p style={{ color: '#606060', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto', lineHeight: 1.5 }}>
            {t(
              'End-to-end encrypted with AES-256-GCM. Files are encrypted client-side in your browser before transmission.',
              'AES-256-GCM के साथ एंड-टू-एंड एन्क्रिप्टेड। ट्रांसमिशन से पहले फ़ाइलें आपके ब्राउज़र में क्लाइंट-साइड एन्क्रिप्ट की जाती हैं।'
            )}
          </p>
        </div>

        {/* Instructions at starting of form */}
        <div style={{ background: '#F8FAFC', border: '1px solid #EBEAEA', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#606060', lineHeight: 1.5 }}>
          <strong>{t('Instructions:', 'निर्देश:')}</strong>{' '}
          {t(
            "Enter the recipient's registered username and select a file to encrypt. Both fields marked with an asterisk (*) are mandatory. Maximum file size is 100 MB.",
            'प्राप्तकर्ता का पंजीकृत उपयोगकर्ता नाम दर्ज करें और एन्क्रिप्ट करने के लिए एक फ़ाइल चुनें। तारांकन (*) से चिह्नित दोनों फ़ील्ड अनिवार्य हैं। अधिकतम फ़ाइल आकार 100 MB है।'
          )}
          <div style={{ marginTop: '0.45rem', color: '#162F6A', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🔒</span>
            <span>
              {t(
                'Sharing Policy: Max 1 active file per recipient. You can send another file once the recipient deletes the existing file from the server.',
                'साझाकरण नीति: प्रति प्राप्तकर्ता अधिकतम 1 सक्रिय फ़ाइल। प्राप्तकर्ता द्वारा सर्वर से मौजूदा फ़ाइल हटाने के बाद ही आप दूसरी फ़ाइल भेज सकते हैं।'
              )}
            </span>
          </div>
        </div>

        {error && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <span>{error}</span>
          </div>
        )}

        {statusMsg && !error && (
          <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <span>{statusMsg}</span>
          </div>
        )}

        {lastTiming && !error && (
          <div
            style={{
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '8px',
              padding: '0.9rem 1.1rem',
              marginBottom: '1.25rem',
              color: '#166534',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                <span>⚡</span>
                <span>{t('Client-Side Encryption Benchmark', 'क्लाइंट-साइड एन्क्रिप्शन बेंचमार्क')}:</span>
                <span
                  style={{
                    background: '#DCFCE7',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid #86EFAC',
                    color: '#15803D',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                  }}
                >
                  {lastTiming.encryptionTimeMs} ms
                </span>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#15803D' }}>
                {lastTiming.filename} ({formatFileSize(lastTiming.fileSize)})
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#15803D', lineHeight: 1.45 }}>
              <strong>{t('Exact measurement:', 'सटीक माप:')}</strong>{' '}
              {t(
                'High-resolution performance.now() timer measuring client-side HKDF-SHA256 session key derivation + AES-256-GCM symmetric block encryption and 128-bit authentication tag calculation. Excludes local file selection disk I/O and server upload latency.',
                'उच्च-रिज़ॉल्यूशन performance.now() टाइमर क्लाइंट-साइड HKDF-SHA256 सत्र कुंजी व्युत्पत्ति + AES-256-GCM सममित ब्लॉक एन्क्रिप्शन और 128-बिट प्रमाणीकरण टैग गणना को मापता है। स्थानीय फ़ाइल चयन डिस्क I/O और सर्वर अपलोड विलंबता को बाहर करता है।'
              )}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Field 1: Recipient Username */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
              <label htmlFor="receiverUsername" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#150202', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {t('Recipient Username', 'प्राप्तकर्ता उपयोगकर्ता नाम')} <span style={{ color: '#DC3545' }}>*</span> <span style={{ fontSize: '0.75rem', color: '#606060' }}>({t('Required', 'अनिवार्य')})</span>
              </label>
              <button
                type="button"
                id="check-registered-users-btn"
                onClick={() => {
                  setShowUsersModal(true)
                  setUserFilter('')
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#EEF2FF',
                  border: '1px solid #A3BBF3',
                  color: '#162F6A',
                  padding: '0.24rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#D2DFFF')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#EEF2FF')}
                title={t('Check list of registered users eligible to receive files', 'फ़ाइलें प्राप्त करने के पात्र पंजीकृत उपयोगकर्ताओं की सूची जांचें')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>{t('Check Registered Users', 'पंजीकृत उपयोगकर्ता देखें')}</span>
                <span
                  style={{
                    backgroundColor: '#214AAB',
                    color: '#FFFFFF',
                    borderRadius: '10px',
                    fontSize: '0.7rem',
                    padding: '1px 6px',
                    fontWeight: 700,
                  }}
                >
                  3
                </span>
              </button>
            </div>

            <input
              id="receiverUsername"
              type="text"
              required
              className="form-control"
              placeholder={t('e.g. demo, chandan, withprabhav', 'उदा. demo, chandan, withprabhav')}
              value={receiverUsername}
              onChange={e => setReceiverUsername(e.target.value)}
              style={{
                backgroundColor: '#FFFFFF',
                border: recipientStatus?.hasActive ? '1px solid #DC3545' : '1px solid #C6C6C6',
              }}
            />

            {/* Quick-Pick Registered Users */}
            <div style={{ marginTop: '0.45rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ fontSize: '0.76rem', color: '#606060', fontWeight: 600 }}>
                {t('Registered Users:', 'पंजीकृत उपयोगकर्ता:')}
              </span>
              {REGISTERED_USERS.map(user => {
                const isSelected = receiverUsername.trim().toLowerCase() === user.username.toLowerCase()
                return (
                  <button
                    key={user.username}
                    type="button"
                    onClick={() => setReceiverUsername(user.username)}
                    style={{
                      fontSize: '0.76rem',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '14px',
                      border: isSelected ? '1px solid #214AAB' : '1px solid #CBD5E1',
                      backgroundColor: isSelected ? '#214AAB' : '#F8FAFC',
                      color: isSelected ? '#FFFFFF' : '#162F6A',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                    title={`Click to select @${user.username}`}
                  >
                    <span>@{user.username}</span>
                    {isSelected && <span style={{ fontSize: '0.7rem' }}>✓</span>}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => {
                  setShowUsersModal(true)
                  setUserFilter('')
                }}
                style={{
                  fontSize: '0.75rem',
                  color: '#214AAB',
                  background: 'none',
                  border: 'none',
                  padding: '0 4px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontWeight: 600,
                }}
              >
                {t('Check All (3) ↗', 'सभी जांचें (3) ↗')}
              </button>
            </div>
            {recipientStatus?.hasActive && (
              <div
                style={{
                  marginTop: '6px',
                  padding: '0.55rem 0.85rem',
                  backgroundColor: '#FFF3CD',
                  border: '1px solid #FFE69C',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  color: '#664D03',
                  lineHeight: 1.45,
                }}
              >
                ⚠️ <strong>{t('Active File Limit Reached:', 'सक्रिय फ़ाइल सीमा पूर्ण:')}</strong>{' '}
                {t(
                  `You already have an active file${recipientStatus.existingFilename ? ` ("${recipientStatus.existingFilename}")` : ''} sent to ${receiverUsername.trim()}. You can only send another file once this recipient deletes the existing file from the server.`,
                  `आप पहले ही ${receiverUsername.trim()} को एक सक्रिय फ़ाइल${recipientStatus.existingFilename ? ` ("${recipientStatus.existingFilename}")` : ''} भेज चुके हैं। आप दूसरी फ़ाइल तभी भेज सकेंगे जब प्राप्तकर्ता सर्वर से मौजूदा फ़ाइल को हटा देगा।`
                )}
              </div>
            )}
            <span className="field-help" style={{ color: '#606060', fontSize: '0.78rem', marginTop: '2px', display: 'block' }}>
              {t(
                "The portal looks up the recipient's registered public key to establish DH agreement.",
                'पोर्टल DH समझौते को स्थापित करने के लिए प्राप्तकर्ता की पंजीकृत सार्वजनिक कुंजी देखता है।'
              )}
            </span>
          </div>

          {/* Field 2: File to Encrypt */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="file-upload-input" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#150202', marginBottom: '4px', display: 'block' }}>
              {t('File to Encrypt', 'एन्क्रिप्ट करने के लिए फ़ाइल')} <span style={{ color: '#DC3545' }}>*</span> <span style={{ fontSize: '0.75rem', color: '#606060' }}>({t('Required', 'अनिवार्य')})</span>
            </label>

            {file ? (
              <div
                style={{
                  border: '1px solid #162F6A',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                  <div style={{ background: '#EEF2FF', padding: '0.5rem', borderRadius: '6px' }}>
                    📄
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, color: '#162F6A', fontSize: '0.92rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </div>
                    <div style={{ color: '#606060', fontSize: '0.78rem' }}>
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearFile}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #C6C6C6',
                    borderRadius: '4px',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.8rem',
                    color: '#DC3545',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {t('Remove', 'हटाएं')}
                </button>
              </div>
            ) : (
              <div
                className={`file-dropzone ${isDragging ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed #C6C6C6',
                  borderRadius: '8px',
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  backgroundColor: '#F8FAFC',
                  cursor: 'pointer',
                }}
              >
                <input
                  id="file-upload-input"
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  accept={FILE_INPUT_ACCEPT}
                  onChange={handleFileChange}
                />
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: '#EEF2FF',
                    color: '#214AAB',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.75rem',
                  }}
                >
                  <IconUpload size={26} color="#214AAB" />
                </div>
                <div>
                  <div className="file-dropzone-text" style={{ color: '#150202', fontWeight: 600, fontSize: '0.92rem' }}>
                    {t('Click to select file, or drag and drop here', 'फ़ाइल चुनने के लिए क्लिक करें, या यहां खींचें और छोड़ें')}
                  </div>
                  <div className="file-dropzone-sub" style={{ color: '#606060', fontSize: '0.8rem', marginTop: '4px' }}>
                    {t(
                      `Supports ${SUPPORTED_FORMATS_LABEL} up to 100 MB`,
                      `100 MB तक ${SUPPORTED_FORMATS_LABEL} समर्थित`
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="btn-primary btn-full"
            style={{
              padding: '0.85rem 1.5rem',
              fontSize: '0.95rem',
              marginTop: '0.5rem',
              backgroundColor: !isFormValid ? '#E2E8F0' : '#214AAB',
              color: !isFormValid ? '#64748B' : '#FFFFFF',
              border: !isFormValid ? '1px solid #CBD5E1' : '1px solid #214AAB',
              cursor: !isFormValid ? 'not-allowed' : 'pointer',
              boxShadow: !isFormValid ? 'none' : '0 3px 8px rgba(33, 74, 171, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? (
              <span>{t('Processing & Encrypting...', 'प्रसंस्करण एवं एन्क्रिप्ट किया जा रहा है...')}</span>
            ) : (
              <>
                <IconLock size={20} color={!isFormValid ? '#64748B' : '#FFFFFF'} />
                <span>{t('Encrypt & Upload', 'एन्क्रिप्ट करें और भेजें')}</span>
              </>
            )}
          </button>
        </form>

        {/* Registered Users Modal */}
        {showUsersModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="registered-users-modal-title"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(21, 2, 2, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100000,
              padding: '1rem',
            }}
            onClick={() => setShowUsersModal(false)}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '2px solid #EBEAEA',
                borderRadius: '12px',
                maxWidth: '560px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '1.75rem',
                boxShadow: '0 12px 36px rgba(0,0,0,0.18)',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: '#D2DFFF',
                      color: '#162F6A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div>
                    <h2 id="registered-users-modal-title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#162F6A' }}>
                      {t('Registered Users Directory', 'पंजीकृत उपयोगकर्ता निर्देशिका')}
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#606060' }}>
                      {t('Select an active registered user to receive encrypted files', 'एन्क्रिप्टेड फ़ाइल प्राप्त करने के लिए सक्रिय पंजीकृत उपयोगकर्ता चुनें')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUsersModal(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '1.5rem',
                    lineHeight: '1',
                    color: '#606060',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: '4px',
                  }}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              {/* Search Filter Bar */}
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder={t('Filter by username, name, or role...', 'उपयोगकर्ता नाम, नाम या भूमिका से खोजें...')}
                  value={userFilter}
                  onChange={e => setUserFilter(e.target.value)}
                  className="form-control"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem',
                    fontSize: '0.85rem',
                    border: '1px solid #C6C6C6',
                    borderRadius: '6px',
                    backgroundColor: '#F8FAFC',
                  }}
                />
              </div>

              {/* List of Registered Users */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {filteredUsers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: '#606060', fontSize: '0.88rem' }}>
                    {t('No registered user matches your search.', 'आपकी खोज से मेल खाता कोई पंजीकृत उपयोगकर्ता नहीं मिला।')}
                  </div>
                ) : (
                  filteredUsers.map(user => {
                    const isSelected = receiverUsername.trim().toLowerCase() === user.username.toLowerCase()
                    return (
                      <div
                        key={user.username}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.85rem 1rem',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #214AAB' : '1px solid #EBEAEA',
                          backgroundColor: isSelected ? '#F0F4FF' : '#FFFFFF',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '50%',
                              backgroundColor: isSelected ? '#214AAB' : '#D2DFFF',
                              color: isSelected ? '#FFFFFF' : '#162F6A',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.92rem',
                            }}
                          >
                            {user.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, color: '#162F6A', fontSize: '0.95rem' }}>
                                @{user.username}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: '#E2FBE8',
                                  color: '#198754',
                                  fontWeight: 600,
                                  border: '1px solid #A3E6B4',
                                }}
                              >
                                {t('Active Key', 'सक्रिय कुंजी')}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#150202', fontWeight: 500, marginTop: '2px' }}>
                              {user.displayName}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#606060' }}>
                              {t(user.roleEn, user.roleHi)} • {user.email}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setReceiverUsername(user.username)
                            setShowUsersModal(false)
                          }}
                          style={{
                            backgroundColor: isSelected ? '#198754' : '#214AAB',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.45rem 0.85rem',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap',
                            transition: 'background-color 0.15s ease',
                          }}
                        >
                          {isSelected ? (
                            <>
                              <span>✓</span>
                              <span>{t('Selected', 'चयनित')}</span>
                            </>
                          ) : (
                            <span>{t('Select Recipient', 'प्राप्तकर्ता चुनें')}</span>
                          )}
                        </button>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Modal Info & Close */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #EBEAEA',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.8rem',
                  color: '#606060',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                <span>🔒</span>
                <span>
                  {t(
                    'Selecting a user sets the recipient username and initiates ECDH P-256 key agreement for client encryption.',
                    'उपयोगकर्ता चुनने से प्राप्तकर्ता का नाम सेट होता है और क्लाइंट एन्क्रिप्शन के लिए ECDH P-256 कुंजी समझौता आरंभ होता है।'
                  )}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowUsersModal(false)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #C6C6C6',
                    color: '#150202',
                    padding: '0.45rem 1.25rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t('Close', 'बंद करें')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
