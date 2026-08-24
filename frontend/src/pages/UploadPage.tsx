import { useState } from 'react'
import { api } from '../api/client'
import { generateEphemeralKeyPair } from '../../../crypto/src/keypair'
import { deriveTransferKey } from '../../../crypto/src/hkdf'
import { encryptFile } from '../../../crypto/src/aes-gcm'

const MAX_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

export default function UploadPage() {
  const [receiverUsername, setReceiverUsername] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setStatusMsg(null)
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.size > MAX_UPLOAD_SIZE_BYTES) {
        setFile(null)
        e.target.value = ''
        setError(`File size is ${formatFileSize(selectedFile.size)}. Maximum allowed size is 100 MB.`)
        return
      }
      setFile(selectedFile)
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !receiverUsername) return
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setError('Maximum upload size is 100 MB. Choose a smaller file.')
      return
    }

    setLoading(true)
    setError(null)
    setStatusMsg('Step 1/4: Looking up receiver public key...')

    try {
      // 1. Fetch receiver's long-term public key
      const keyRes = await api.auth.lookupPublicKey({ username: receiverUsername.trim() })
      if (!keyRes.found || !keyRes.public_key) {
        throw new Error(`Receiver '${receiverUsername}' not found or has no public key registered.`)
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

      setStatusMsg(`Success! Encrypted file '${file.name}' queued. Transfer ID: ${uploadRes.transfer_id}`)
      setFile(null)
      setReceiverUsername('')
    } catch (err: any) {
      setError(err.message || 'Encryption or upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell page-shell-narrow">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Client-side encrypted delivery</p>
          <h1>Send Encrypted File</h1>
          <p>
            Files are encrypted in your browser with AES-256-GCM before upload. The queue stores only encrypted blobs and transfer metadata.
          </p>
        </div>
        <div className="hero-metric">
          <span>Max file size</span>
          <strong>100 MB</strong>
        </div>
      </section>

      {error && <div className="alert alert-error">{error}</div>}
      {statusMsg && !error && <div className="alert alert-success">{statusMsg}</div>}

      <section className="glass-card transfer-panel">
        <form onSubmit={handleUploadSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Receiver Username</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. bob"
                value={receiverUsername}
                onChange={e => setReceiverUsername(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Select File to Encrypt & Send</label>
              <input
                type="file"
                required
                className="form-control"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {file && (
            <div className="file-preview">
              <div>
                <span className="file-icon">FILE</span>
                <strong>{file.name}</strong>
              </div>
              <span>{formatFileSize(file.size)}</span>
            </div>
          )}

          <div className="process-strip">
            <span>Lookup key</span>
            <span>Ephemeral DH</span>
            <span>AES-GCM</span>
            <span>Queue blob</span>
          </div>

          <button type="submit" disabled={loading || !file} className="btn-primary btn-full">
            {loading ? 'Processing Crypto & Uploading...' : 'Encrypt & Queue Transfer'}
          </button>
        </form>
      </section>
    </div>
  )
}
