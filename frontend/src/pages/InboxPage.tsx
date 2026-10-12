import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { getStoredPrivateKey } from '../crypto/keystore'
import { deriveTransferKey } from '../crypto/hkdf'
import { decryptFile } from '../crypto/aes-gcm'

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
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [downloadTracker, setDownloadTracker] = useState<Record<string, { decrypted?: boolean; encrypted?: boolean }>>(() => {
    try {
      const saved = localStorage.getItem('sfs_download_tracker')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const updateDownloadTracker = (transferId: string, patch: { decrypted?: boolean; encrypted?: boolean }) => {
    setDownloadTracker(prev => {
      const current = prev[transferId] || {}
      const updated = {
        ...prev,
        [transferId]: { ...current, ...patch },
      }
      try {
        localStorage.setItem('sfs_download_tracker', JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
  }

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
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 10000)
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
      updateDownloadTracker(transferId, { decrypted: true })
      setStatusMsg(`Decryption successful! "${filename}" downloaded. The transfer is retained in your inbox so you can also download the raw encrypted file, or click Remove when done.`)
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
      updateDownloadTracker(transferId, { encrypted: true })
      setStatusMsg(`Encrypted file "${binFilename}" downloaded! The transfer is retained in your inbox so you can also decrypt & download, or click Remove when done.`)
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

  const handleRemoveTransfer = async (transferId: string) => {
    if (!window.confirm('Are you sure you want to remove this transfer? The encrypted file will be permanently purged from the server.')) {
      return
    }
    setRemovingId(transferId)
    setError(null)
    try {
      await api.transfers.delete(transferId)
      setPendingTransfers(prev => prev.filter(t => t.transfer_id !== transferId))
      setDownloadTracker(prev => {
        const updated = { ...prev }
        delete updated[transferId]
        try {
          localStorage.setItem('sfs_download_tracker', JSON.stringify(updated))
        } catch {
          // ignore
        }
        return updated
      })
      setStatusMsg('Transfer removed and server copy permanently purged.')
    } catch (err: any) {
      setError(err.message || 'Failed to remove transfer from server.')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="page-shell" style={{ padding: '1.5rem 1rem' }}>
      {/* Breadcrumb Trail (DBIM Section 4.5.ii) */}
      <nav aria-label="Breadcrumb" style={{ fontSize: '0.82rem', color: '#606060', marginBottom: '1rem' }}>
        <Link to="/" style={{ color: '#214AAB', textDecoration: 'none' }}>Home</Link>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span style={{ color: '#150202', fontWeight: 600 }}>Recipient Inbox</span>
      </nav>

      <div className="glass-card" style={{ background: '#FFFFFF', border: '1px solid #EBEAEA', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#162F6A', margin: '0 0 0.35rem' }}>
              Recipient Inbox &amp; Pending Transfers
            </h1>
            <p style={{ color: '#606060', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
              Decrypt incoming transfers locally in your browser using your hardware-stored private key.
            </p>
          </div>
          <button
            onClick={fetchPending}
            className="btn-secondary"
            style={{ padding: '0.5rem 1rem', background: '#FFFFFF', border: '1px solid #C6C6C6', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#150202' }}
          >
            ↻ Refresh Inbox
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {statusMsg && <div className="alert alert-success">{statusMsg}</div>}

        {loading ? (
          <div className="empty-state">Loading pending encrypted transfers...</div>
        ) : pendingTransfers.length === 0 ? (
          <div className="empty-state">No pending transfers queued for your account.</div>
        ) : (
          /* Table conforms to DBIM Section 4.1.1.i:
             "The Table must have left-aligned text, right-aligned numbers, and center-aligned column names." */
          <div className="table-container" style={{ border: '1px solid #EBEAEA', borderRadius: '8px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #EBEAEA' }}>
                  <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>Sender</th>
                  <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>Transfer ID</th>
                  <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>File Size</th>
                  <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>Status</th>
                  <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A', minWidth: '320px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingTransfers.map(item => {
                  const isProcessing = activeTransferId === item.transfer_id
                  const isRemoving = removingId === item.transfer_id
                  const tracker = downloadTracker[item.transfer_id] || {}

                  return (
                    <tr key={item.transfer_id} style={{ borderBottom: '1px solid #EBEAEA' }}>
                      {/* Left-aligned text (DBIM Section 4.1.1.i) */}
                      <td style={{ textAlign: 'left', padding: '0.85rem 1rem', color: '#150202', fontWeight: 600 }}>
                        {item.sender}
                      </td>
                      {/* Monospace Identifier */}
                      <td style={{ textAlign: 'left', padding: '0.85rem 1rem', color: '#606060', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                        {item.transfer_id.slice(0, 18)}...
                      </td>
                      {/* Right-aligned numbers (DBIM Section 4.1.1.i) */}
                      <td style={{ textAlign: 'right', padding: '0.85rem 1rem' }}>
                        <span style={{ background: '#F8FAFC', border: '1px solid #EBEAEA', color: '#150202', padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                          {formatFileSize(item.file_size_bytes)}
                        </span>
                      </td>
                      {/* Status */}
                      <td style={{ textAlign: 'center', padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                          {tracker.decrypted && (
                            <span style={{ background: '#E6F4EA', color: '#198754', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                              Decrypted ✓
                            </span>
                          )}
                          {tracker.encrypted && (
                            <span style={{ background: '#D2DFFF', color: '#162F6A', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                              Ciphertext (.bin) ✓
                            </span>
                          )}
                          {!tracker.decrypted && !tracker.encrypted && (
                            <span style={{ background: '#FFFBEB', color: '#916100', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                              {item.status}
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Action buttons */}
                      <td style={{ textAlign: 'center', padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                          {/* Decrypt & Download (Section 4.5 i: max 3 words) */}
                          <button
                            className="btn-primary"
                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', backgroundColor: '#214AAB' }}
                            disabled={isProcessing || isRemoving}
                            onClick={() => handleDecryptAndDownload(item.transfer_id)}
                            title="Decrypt client-side using private key and download original file"
                          >
                            {isProcessing && activeAction === 'decrypt' ? 'Decrypting...' : 'Decrypt & Download'}
                          </button>

                          {/* Download Raw Ciphertext */}
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', background: '#FFFFFF', border: '1px solid #C6C6C6' }}
                            disabled={isProcessing || isRemoving}
                            onClick={() => handleDownloadEncryptedBin(item.transfer_id)}
                            title="Download raw ciphertext blob without decrypting"
                          >
                            {isProcessing && activeAction === 'bin' ? 'Downloading...' : 'Download (.bin)'}
                          </button>

                          {/* Secondary action with warning (Annexure B.xiii) */}
                          <button
                            className="btn-danger"
                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', background: '#FFFFFF', border: '1px solid #DC3545', color: '#DC3545' }}
                            disabled={isProcessing || isRemoving}
                            onClick={() => handleRemoveTransfer(item.transfer_id)}
                            title="Permanently remove transfer and purge file from server"
                          >
                            {isRemoving ? 'Purging...' : 'Remove'}
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
