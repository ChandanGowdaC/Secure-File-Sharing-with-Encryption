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
  if (bytes === null || bytes === undefined || bytes <= 0) return '< 1 KB'
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

export const InboxPage: React.FC = () => {
  const [pendingTransfers, setPendingTransfers] = useState<PendingTransferItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [activeTransferId, setActiveTransferId] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<'decrypt' | 'bin' | null>(null)
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

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDecryptAndDownload = async (transferId: string) => {
    setActiveTransferId(transferId)
    setActiveAction('decrypt')
    setError(null)
    setStatusMsg('Step 1/4: Fetching encrypted blob from server...')

    try {
      const payload = await api.transfers.deliver(transferId)

      setStatusMsg('Step 2/4: Retrieving long-term private key from IndexedDB...')
      const currentUser = localStorage.getItem('sfs_username') || ''
      const receiverPrivateKey = await getStoredPrivateKey(currentUser)
      if (!receiverPrivateKey) {
        throw new Error('Long-term private key missing from IndexedDB! Please restore key on Register page.')
      }

      setStatusMsg('Step 3/4: Deriving 256-bit transfer key with HKDF-SHA256...')
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

      const filename = payload.original_filename || `decrypted_${transferId.slice(0, 8)}.txt`
      triggerDownload(new Blob([decryptedBuffer]), filename)

      await api.transfers.downloadAck(transferId, { success: true })
      setStatusMsg(`Decryption successful! "${filename}" downloaded and server blob copy permanently purged.`)
      fetchPending()
    } catch (err: any) {
      setError(err.message || 'Decryption failed. Authentication tag mismatch or corrupt ciphertext.')
      try {
        await api.transfers.downloadAck(transferId, { success: false })
      } catch {
        // ignore
      }
    } finally {
      setActiveTransferId(null)
      setActiveAction(null)
    }
  }

  const handleDownloadEncryptedBin = async (transferId: string) => {
    setActiveTransferId(transferId)
    setActiveAction('bin')
    setError(null)
    setStatusMsg('Fetching raw encrypted ciphertext (.bin)...')

    try {
      const payload = await api.transfers.deliver(transferId)

      // Convert Base64 ciphertext to binary Uint8Array
      const binaryString = atob(payload.ciphertext)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const originalName = payload.original_filename ? payload.original_filename.replace(/\.[^/.]+$/, '') : transferId.slice(0, 8)
      const binFilename = `${originalName}_encrypted.bin`
      triggerDownload(new Blob([bytes], { type: 'application/octet-stream' }), binFilename)

      await api.transfers.downloadAck(transferId, { success: true })
      setStatusMsg(`Encrypted file "${binFilename}" downloaded and server copy purged.`)
      fetchPending()
    } catch (err: any) {
      setError(err.message || 'Failed to download encrypted file.')
      try {
        await api.transfers.downloadAck(transferId, { success: false })
      } catch {
        // ignore
      }
    } finally {
      setActiveTransferId(null)
      setActiveAction(null)
    }
  }

  return (
    <div className="page-shell">
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2>Inbox & Pending Transfers</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Select whether to decrypt client-side or download the raw encrypted ciphertext (.bin). Files are purged from the server immediately upon receipt.
            </p>
          </div>
          <button onClick={fetchPending} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '6px' }}>
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Refresh
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {statusMsg && <div className="alert alert-success">{statusMsg}</div>}

        {loading ? (
          <div className="empty-state">Loading pending transfers...</div>
        ) : pendingTransfers.length === 0 ? (
          <div className="empty-state">No pending files queued for delivery.</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Sender</th>
                  <th>Transfer ID</th>
                  <th>File Size</th>
                  <th>Status</th>
                  <th style={{ minWidth: '300px' }}>Download Options</th>
                </tr>
              </thead>
              <tbody>
                {pendingTransfers.map(item => {
                  const isProcessing = activeTransferId === item.transfer_id
                  return (
                    <tr key={item.transfer_id}>
                      <td><strong>{item.sender}</strong></td>
                      <td className="mono-cell">{item.transfer_id.slice(0, 18)}...</td>
                      <td>
                        <span className="badge badge-pending" style={{ background: '#f1f5f9', color: '#475569' }}>
                          {formatFileSize(item.file_size_bytes)}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-pending">{item.status}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            className="btn-primary"
                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
                            disabled={isProcessing}
                            onClick={() => handleDecryptAndDownload(item.transfer_id)}
                          >
                            {isProcessing && activeAction === 'decrypt' ? (
                              'Decrypting...'
                            ) : (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                  <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                                </svg>
                                Decrypt & Download
                              </>
                            )}
                          </button>

                          <button
                            className="btn-secondary"
                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
                            disabled={isProcessing}
                            onClick={() => handleDownloadEncryptedBin(item.transfer_id)}
                          >
                            {isProcessing && activeAction === 'bin' ? (
                              'Downloading...'
                            ) : (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <polyline points="7 10 12 15 17 10" />
                                  <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Download Encrypted (.bin)
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
