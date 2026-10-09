import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import { getStoredPrivateKey } from '../../../crypto/src/keystore'
import { deriveTransferKey } from '../../../crypto/src/hkdf'
import { decryptFile } from '../../../crypto/src/aes-gcm'

interface PendingTransferItem {
  transfer_id: string
  sender: string
  receiver: string
  status: string
  file_size_bytes?: number | null
}

function formatFileSize(bytes?: number | null) {
  if (bytes === null || bytes === undefined) return 'Unknown'
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

export const InboxPage: React.FC = () => {
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

  const handleDecryptAndDownload = async (transferId: string) => {
    setActiveTransferId(transferId)
    setError(null)
    setStatusMsg('Step 1/4: Fetching encrypted blob from server...')

    try {
      // 1. Deliver payload from FastAPI (triggers server blob storage purge)
      const payload = await api.transfers.deliver(transferId)

      setStatusMsg('Step 2/4: Retrieving long-term private key from IndexedDB...')
      const currentUser = localStorage.getItem('sfs_username') || ''
      const receiverPrivateKey = await getStoredPrivateKey(currentUser)
      if (!receiverPrivateKey) {
        throw new Error('Long-term private key missing from IndexedDB! Please re-register or restore key.')
      }

      setStatusMsg('Step 3/4: Deriving transfer key...')
      const transferKey = await deriveTransferKey(receiverPrivateKey, payload.sender_ephemeral_public_key)

      setStatusMsg('Step 4/4: Decrypting ciphertext & verifying AES-256-GCM auth tag...')
      const decryptedBuffer = await decryptFile(
        {
          ciphertext: payload.ciphertext,
          nonce: payload.nonce,
          authTag: payload.auth_tag,
        },
        transferKey
      )

      // 2. Trigger browser download for decrypted file
      const filename = payload.original_filename || `decrypted_${transferId.slice(0, 8)}.bin`
      const blob = new Blob([decryptedBuffer])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // 2.5 Trigger browser download for raw encrypted file
      const rawBlob = new Blob([payload.ciphertext])
      const rawUrl = URL.createObjectURL(rawBlob)
      const rawA = document.createElement('a')
      rawA.href = rawUrl
      rawA.download = `raw_encrypted_${transferId.slice(0, 8)}.bin`
      document.body.appendChild(rawA)
      rawA.click()
      document.body.removeChild(rawA)
      URL.revokeObjectURL(rawUrl)

      // 3. Acknowledge download completion
      await api.transfers.downloadAck(transferId, { success: true })

      setStatusMsg(`Decryption successful! Files downloaded and server copy purged.`)
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
    <div className="page-shell">
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2>Inbox & Pending Transfers</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Delivered files are decrypted in browser memory and immediately purged from server storage.
            </p>
          </div>
          <button onClick={fetchPending} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '6px' }}><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
            Refresh
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {statusMsg && <div className="alert alert-success">{statusMsg}</div>}

        {loading ? (
          <div className="empty-state">
            Loading pending transfers...
          </div>
        ) : pendingTransfers.length === 0 ? (
          <div className="empty-state">
            No pending files queued for delivery.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Sender</th>
                  <th>Transfer ID</th>
                  <th>File Size</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingTransfers.map(item => (
                  <tr key={item.transfer_id}>
                    <td><strong>{item.sender}</strong></td>
                    <td className="mono-cell">{item.transfer_id.slice(0, 18)}...</td>
                    <td>{formatFileSize(item.file_size_bytes)}</td>
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
                        {activeTransferId === item.transfer_id ? 'Decrypting...' : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            Decrypt & Download Both
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
