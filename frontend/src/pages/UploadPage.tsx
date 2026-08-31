import React, { useState } from 'react'
import { api } from '../api/client'
import { generateEphemeralKeyPair } from '../../../crypto/src/keypair'
import { deriveTransferKey } from '../../../crypto/src/hkdf'
import { encryptFile } from '../../../crypto/src/aes-gcm'
import { CRYPTO_PARAMS } from '../../../crypto/src/constants'

export default function UploadPage() {
  const [receiverUsername, setReceiverUsername] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const arrayBufferToBase64 = (buffer: Uint8Array): string => {
    let binary = ''
    for (let i = 0; i < buffer.byteLength; i++) {
      binary += String.fromCharCode(buffer[i])
    }
    return btoa(binary)
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !receiverUsername) return

    setLoading(true)
    setError(null)
    setStatusMsg('Step 1/4: Looking up receiver public key...')

    try {
      // 1. Fetch receiver's long-term public key
      const keyRes = await api.auth.lookupPublicKey({ username: receiverUsername.trim() })
      if (!keyRes.found || !keyRes.public_key) {
        throw new Error(`Receiver '${receiverUsername}' not found or has no public key registered.`)
      }

      setStatusMsg('Step 2/4: Importing receiver public key...')
      const receiverJwk = JSON.parse(keyRes.public_key)
      const receiverPublicKey = await crypto.subtle.importKey(
        'jwk',
        receiverJwk,
        CRYPTO_PARAMS.ECDH,
        false,
        []
      )

      setStatusMsg('Step 3/4: Generating ephemeral DH keypair & deriving AES-256-GCM key...')
      // 2. Generate ephemeral key pair
      const ephemeralKeypair = await generateEphemeralKeyPair()

      // 3. Derive 256-bit transfer key using HKDF-SHA256
      const transferKey = await deriveTransferKey(ephemeralKeypair.privateKey, receiverPublicKey)

      // 4. Read file bytes and encrypt with AES-256-GCM
      setStatusMsg('Step 4/4: Encrypting file client-side...')
      const fileBuffer = await file.arrayBuffer()
      const fileBytes = new Uint8Array(fileBuffer)

      const { ciphertext, nonce, authTag } = await encryptFile(fileBytes, transferKey)

      // 5. Convert to Base64 payloads
      const ciphertextB64 = arrayBufferToBase64(ciphertext)
      const nonceB64 = arrayBufferToBase64(nonce)
      const authTagB64 = arrayBufferToBase64(authTag)

      const ephemeralPubJwk = await crypto.subtle.exportKey('jwk', ephemeralKeypair.publicKey)
      const ephemeralPubJson = JSON.stringify(ephemeralPubJwk)

      // 6. Send payload to server
      const uploadRes = await api.transfers.upload({
        receiver_username: receiverUsername.trim(),
        ciphertext: ciphertextB64,
        nonce: nonceB64,
        auth_tag: authTagB64,
        sender_ephemeral_public_key: ephemeralPubJson,
        original_filename: file.name,
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
    <div style={{ maxWidth: '600px', margin: '2rem auto' }} className="glass-card">
      <h2 style={{ marginBottom: '0.5rem' }}>Send Encrypted File</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        File is encrypted in your browser using AES-256-GCM before transmission. The server never receives unencrypted contents or private keys.
      </p>

      {error && <div className="alert alert-error">{error}</div>}
      {statusMsg && !error && <div className="alert alert-success">{statusMsg}</div>}

      <form onSubmit={handleUploadSubmit}>
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
            style={{ padding: '0.5rem' }}
          />
        </div>

        {file && (
          <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            📄 Selected File: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
          </div>
        )}

        <button type="submit" disabled={loading || !file} className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
          {loading ? 'Processing Crypto & Uploading...' : '🔒 Encrypt & Queue Transfer'}
        </button>
      </form>
    </div>
  )
}
