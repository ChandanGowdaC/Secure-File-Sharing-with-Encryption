import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import { getStoredPrivateKey } from '../../../crypto/src/keystore'
import { deriveTransferKey } from '../../../crypto/src/hkdf'
import { decryptFile } from '../../../crypto/src/aes-gcm'
import { CRYPTO_PARAMS } from '../../../crypto/src/constants'

interface PendingTransferItem {
  transfer_id: string
  sender: string
  receiver: string
  status: string
}

export default function InboxPage() {
  const [pendingTransfers, setPendingTransfers] = useState<PendingTransferItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [activeTransferId, setActiveTransferId] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchPending = async () => {
    setLoading(true)
    try {
      const res = await api.transfers.pending()
      setPendingTransfers(res.transfers || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load inbox')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPending()
  }, [])

  const base64ToArrayBuffer = (base64: string): Uint8Array => {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }

  const handleDecryptAndDownload = async (transferId: string) => {
    setActiveTransferId(transferId)
    setError(null)
    setStatusMsg('Step 1/4: Fetching encrypted blob from server...')

    try {
      // 1. Deliver payload from FastAPI (triggers server blob storage purge)
      const payload = await api.transfers.deliver(transferId)

      setStatusMsg('Step 2/4: Retrieving long-term private key from IndexedDB...')
      const receiverPrivateKey = await getStoredPrivateKey()
      if (!receiverPrivateKey) {
        throw new Error('Long-term private key missing from IndexedDB! Please re-register or restore key.')
      }

      setStatusMsg('Step 3/4: Importing sender ephemeral public key & deriving transfer key...')
      const ephemeralPubJwk = JSON.parse(payload.sender_ephemeral_public_key)
      const senderEphemeralPublicKey = await crypto.subtle.importKey(
        'jwk',
        ephemeralPubJwk,
        CRYPTO_PARAMS.ECDH,
        false,
        []
      )

      const transferKey = await deriveTransferKey(receiverPrivateKey, senderEphemeralPublicKey)

      setStatusMsg('Step 4/4: Decrypting ciphertext & verifying AES-256-GCM auth tag...')
      const ciphertextBytes = base64ToArrayBuffer(payload.ciphertext)
      const nonceBytes = base64ToArrayBuffer(payload.nonce)
      const tagBytes = base64ToArrayBuffer(payload.auth_tag)

      const decryptedBytes = await decryptFile(ciphertextBytes, nonceBytes, tagBytes, transferKey)

      // 2. Trigger browser download
      const filename = payload.original_filename || `decrypted_${transferId.slice(0, 8)}.bin`
      const blob = new Blob([decryptedBytes])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // 3. Acknowledge download completion
      await api.transfers.downloadAck(transferId, { success: true })

      setStatusMsg(`Decryption successful! File '${filename}' downloaded and server copy purged.`)
      fetchPending()
    } catch (err: any) {
      setError(err.message || 'Decryption failed. Authentication tag mismatch or corrupt ciphertext.')
      try {
        await api.transfers.downloadAck(transferId, { success: false })
      } catch (ackErr) {
        // ignore
      }
    } finally {
      setActiveTransferId(null)
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto' }} className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>Inbox & Pending Transfers</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Delivered files are decrypted in browser memory and immediately purged from server storage.
          </p>
        </div>
        <button onClick={fetchPending} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
          🔄 Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {statusMsg && <div className="alert alert-success">{statusMsg}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          Loading pending transfers...
        </div>
      ) : pendingTransfers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          📭 No pending files queued for delivery.
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Sender</th>
                <th>Transfer ID</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingTransfers.map(item => (
                <tr key={item.transfer_id}>
                  <td><strong>👤 {item.sender}</strong></td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{item.transfer_id.slice(0, 18)}...</td>
                  <td>
                    <span className="badge badge-pending">{item.status}</span>
                  </td>
                  <td>
                    <button
                      className="btn-primary"
                      style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
                      disabled={activeTransferId === item.transfer_id}
                      onClick={() => handleDecryptAndDownload(item.transfer_id)}
                    >
                      {activeTransferId === item.transfer_id ? 'Decrypting...' : '🔒 Decrypt & Download'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
