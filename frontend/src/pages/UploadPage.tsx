import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { generateEphemeralKeyPair } from '../crypto/keypair'
import { deriveTransferKey } from '../crypto/hkdf'
import { encryptFile } from '../crypto/aes-gcm'
import { IconUpload, IconLock } from '../components/LineIcons'
import { useLanguage } from '../context/LanguageContext'

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
    setStatusMsg(t('Step 1/4: Looking up receiver public key...', 'चरण 1/4: प्राप्तकर्ता की सार्वजनिक कुंजी खोजी जा रही है...'))

    try {
      // 1. Fetch receiver's long-term public key
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
          'Step 2/4: Generating ephemeral DH keypair & deriving AES-256-GCM key...',
          'चरण 2/4: क्षणिक DH कुंजी युग्म उत्पन्न करना और AES-256-GCM कुंजी व्युत्पन्न करना...'
        )
      )
      // 2. Generate ephemeral key pair
      const ephemeralKeypair = await generateEphemeralKeyPair()

      setStatusMsg(
        t(
          'Step 3/4: Encrypting file locally with AES-256-GCM...',
          'चरण 3/4: AES-256-GCM के साथ स्थानीय रूप से फ़ाइल एन्क्रिप्ट की जा रही है...'
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
          'Step 4/4: Uploading ciphertext blob to secure queue...',
          'चरण 4/4: सिफ़रटेक्स्ट ब्लॉब सुरक्षित कतार में अपलोड किया जा रहा है...'
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
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: any) {
      setError(err.message || t('Encryption or upload failed.', 'एन्क्रिप्शन या अपलोड विफल रहा।'))
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = !!file && receiverUsername.trim().length > 0

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
            <label htmlFor="receiverUsername" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#150202', marginBottom: '4px', display: 'block' }}>
              {t('Recipient Username', 'प्राप्तकर्ता उपयोगकर्ता नाम')} <span style={{ color: '#DC3545' }}>*</span> <span style={{ fontSize: '0.75rem', color: '#606060' }}>({t('Required', 'अनिवार्य')})</span>
            </label>
            <input
              id="receiverUsername"
              type="text"
              required
              className="form-control"
              placeholder={t('e.g. bob or user_id', 'उदा. bob या user_id')}
              value={receiverUsername}
              onChange={e => setReceiverUsername(e.target.value)}
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #C6C6C6' }}
            />
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
      </div>
    </div>
  )
}
