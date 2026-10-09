import React, { useState, useRef } from 'react'
import { api } from '../api/client'
import { generateEphemeralKeyPair } from '../../../crypto/src/keypair'
import { deriveTransferKey } from '../../../crypto/src/hkdf'
import { encryptFile } from '../../../crypto/src/aes-gcm'

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
      setStatusMsg('Step 4/4: Uploading encrypted file to server...')
      const uploadRes = await api.transfers.upload({
        receiver_username: receiverUsername.trim(),
        ciphertext,
        nonce,
        auth_tag: authTag,
        sender_ephemeral_public_key: ephemeralKeypair.publicKey,
        original_filename: file.name,
        file_size_bytes: file.size,
      })

      setStatusMsg(`Success! Encrypted file "${file.name}" queued for delivery. Transfer ID: ${uploadRes.transfer_id}`)
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

  return (
    <div className="page-shell page-shell-narrow">
      <div className="glass-card" style={{ padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: '#eef2ff',
            color: 'var(--primary-accent)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="12 8 12 14" />
              <polyline points="9 11 12 8 15 11" />
            </svg>
          </div>
          <h1 style={{ fontSize: '1.65rem', marginBottom: '0.4rem', color: 'var(--text-main)' }}>Send Encrypted File</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto', lineHeight: 1.5 }}>
            End-to-end encrypted with AES-256-GCM. Files are encrypted client-side in your browser before upload.
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {statusMsg && !error && (
          <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>{statusMsg}</span>
          </div>
        )}

        <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="receiverUsername" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Recipient Username
            </label>
            <input
              id="receiverUsername"
              type="text"
              required
              className="form-control"
              placeholder="Enter recipient's username (e.g. bob)"
              value={receiverUsername}
              onChange={e => setReceiverUsername(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              File to Encrypt
            </label>

            {file ? (
              <div className="file-selected-card">
                <div className="file-selected-info">
                  <span className="file-selected-badge">{file.name.split('.').pop() || 'FILE'}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="file-selected-name" title={file.name}>{file.name}</div>
                    <div className="file-selected-size">{formatFileSize(file.size)}</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="file-remove-btn"
                  onClick={handleClearFile}
                  title="Remove file"
                  aria-label="Remove file"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
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
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  accept={FILE_INPUT_ACCEPT}
                  onChange={handleFileChange}
                />
                <div className="file-dropzone-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <div>
                  <div className="file-dropzone-text">Click to choose a file, or drag and drop here</div>
                  <div className="file-dropzone-sub">Supports PDF, DOCX, XLSX, images, and text up to 100 MB</div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !file || !receiverUsername.trim()}
            className="btn-primary btn-full"
            style={{ padding: '0.85rem 1.5rem', fontSize: '0.98rem', marginTop: '0.4rem' }}
          >
            {loading ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                  <line x1="12" y1="2" x2="12" y2="6"></line>
                  <line x1="12" y1="18" x2="12" y2="22"></line>
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                  <line x1="2" y1="12" x2="6" y2="12"></line>
                  <line x1="18" y1="12" x2="22" y2="12"></line>
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                </svg>
                Processing & Uploading...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Encrypt & Queue Transfer
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
