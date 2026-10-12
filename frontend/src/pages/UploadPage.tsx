import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { generateEphemeralKeyPair } from '../crypto/keypair'
import { deriveTransferKey } from '../crypto/hkdf'
import { encryptFile } from '../crypto/aes-gcm'
import { IconUpload, IconLock } from '../components/LineIcons'

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
  const [receiverUsername, setReceiverUsername] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateAndSetFile = (selectedFile: File) => {
    setError(null)
    setStatusMsg(null)
    const extension = selectedFile.name.split('.').pop()?.toLowerCase()
    if (!extension || !SUPPORTED_EXTENSIONS.includes(extension)) {
      setFile(null)
      setError(`"${selectedFile.name}" is not supported. Supported: ${SUPPORTED_FORMATS_LABEL}`)
      return
    }
    if (selectedFile.size > MAX_UPLOAD_SIZE_BYTES) {
      setFile(null)
      setError(`File size is ${formatFileSize(selectedFile.size)}. Maximum allowed size is 100 MB.`)
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
    setStatusMsg('Step 1/4: Looking up receiver public key...')

    try {
      // 1. Fetch receiver's long-term public key
      const keyRes = await api.auth.lookupPublicKey({ username: receiverUsername.trim() })
      if (!keyRes.found || !keyRes.public_key) {
        throw new Error(`Receiver "${receiverUsername.trim()}" not found or has no public key registered.`)
      }

      setStatusMsg('Step 2/4: Generating ephemeral DH keypair & deriving AES-256-GCM key...')
      // 2. Generate ephemeral key pair
      const ephemeralKeypair = await generateEphemeralKeyPair()

      // 3. Derive 256-bit transfer key using HKDF-SHA256
      const transferKey = await deriveTransferKey(ephemeralKeypair.privateKey, keyRes.public_key)

      // 4. Read file bytes and encrypt with AES-256-GCM
      setStatusMsg('Step 3/4: Encrypting file client-side...')
      const fileBuffer = await file.arrayBuffer()
      const { ciphertext, nonce, authTag } = await encryptFile(fileBuffer, transferKey)

      // 5. Send payload to server
      setStatusMsg('Step 4/4: Uploading encrypted ciphertext to sovereign server...')
      const uploadRes = await api.transfers.upload({
        receiver_username: receiverUsername.trim(),
        ciphertext,
        nonce,
        auth_tag: authTag,
        sender_ephemeral_public_key: ephemeralKeypair.publicKey,
        original_filename: file.name,
        file_size_bytes: file.size,
      })

      setStatusMsg(`Success! Encrypted file "${file.name}" queued for recipient. Transfer ID: ${uploadRes.transfer_id}`)
      setFile(null)
      setReceiverUsername('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: any) {
      setError(err.message || 'Encryption or upload failed.')
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = !!file && receiverUsername.trim().length > 0

  return (
    <div className="page-shell page-shell-narrow" style={{ padding: '1.5rem 1rem' }}>
      {/* Breadcrumb Trail (DBIM Section 4.5.ii) */}
      <nav aria-label="Breadcrumb" style={{ fontSize: '0.82rem', color: '#606060', marginBottom: '1rem' }}>
        <Link to="/" style={{ color: '#214AAB', textDecoration: 'none' }}>Home</Link>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span style={{ color: '#150202', fontWeight: 600 }}>Encrypted Upload</span>
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
            Send Encrypted File
          </h1>
          <p style={{ color: '#606060', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto', lineHeight: 1.5 }}>
            End-to-end encrypted with AES-256-GCM. Files are encrypted client-side in your browser before transmission.
          </p>
        </div>

        {/* Instructions at starting of form (DBIM Annexure B.i, Page 109/129) */}
        <div style={{ background: '#F8FAFC', border: '1px solid #EBEAEA', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#606060', lineHeight: 1.5 }}>
          <strong>Instructions:</strong> Enter the recipient&apos;s registered username and select a file to encrypt. Both fields marked with an asterisk (*) are mandatory. Maximum file size is 100 MB.
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

        {/* Form (Annexure B - Single vertical column layout, Figure 81) */}
        <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Field 1: Recipient Username */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="receiverUsername" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#150202', marginBottom: '4px', display: 'block' }}>
              Recipient Username <span style={{ color: '#DC3545' }}>*</span> <span style={{ fontSize: '0.75rem', color: '#606060' }}>(Required)</span>
            </label>
            <input
              id="receiverUsername"
              type="text"
              required
              className="form-control"
              placeholder="e.g. bob or officer_id"
              value={receiverUsername}
              onChange={e => setReceiverUsername(e.target.value)}
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #C6C6C6' }}
            />
            <span className="field-help" style={{ color: '#606060', fontSize: '0.78rem', marginTop: '2px', display: 'block' }}>
              The portal looks up the recipient&apos;s registered public key to establish ECDH agreement.
            </span>
          </div>

          {/* Field 2: File to Encrypt */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="file-upload-input" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#150202', marginBottom: '4px', display: 'block' }}>
              File to Encrypt <span style={{ color: '#DC3545' }}>*</span> <span style={{ fontSize: '0.75rem', color: '#606060' }}>(Required)</span>
            </label>

            {file ? (
              <div className="file-selected-card" style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                <div className="file-selected-info">
                  <span className="file-selected-badge" style={{ background: '#D2DFFF', color: '#162F6A' }}>
                    {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="file-selected-name" title={file.name} style={{ color: '#150202', fontWeight: 600 }}>{file.name}</div>
                    <div className="file-selected-size" style={{ color: '#606060', fontSize: '0.8rem' }}>{formatFileSize(file.size)}</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="file-remove-btn"
                  onClick={handleClearFile}
                  title="Remove file"
                  aria-label="Remove file"
                  style={{ color: '#DC3545' }}
                >
                  &times;
                </button>
              </div>
            ) : (
              <div
                className={`file-dropzone ${isDragging ? 'dragging' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
                style={{
                  border: '2px dashed #CBD5E1',
                  borderRadius: '10px',
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
                    Click to select file, or drag and drop here
                  </div>
                  <div className="file-dropzone-sub" style={{ color: '#606060', fontSize: '0.8rem', marginTop: '4px' }}>
                    Supports {SUPPORTED_FORMATS_LABEL} up to 100 MB
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Primary Action Button - disabled until valid data entered (Annexure B.xiv)
              Short label max 3 words (Section 4.5 i): "Encrypt & Upload" */}
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
              <span>Processing &amp; Encrypting...</span>
            ) : (
              <>
                <IconLock size={20} color={!isFormValid ? '#64748B' : '#FFFFFF'} />
                <span>Encrypt &amp; Upload</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
