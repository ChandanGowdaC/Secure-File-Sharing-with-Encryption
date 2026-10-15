import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { getStoredPrivateKey } from '../crypto/keystore'
import { deriveTransferKey } from '../crypto/hkdf'
import { decryptFile } from '../crypto/aes-gcm'
import { useLanguage } from '../context/LanguageContext'

interface PendingTransfer {
  transfer_id: string
  sender: string
  receiver: string
  status: string
  file_size_bytes?: number | null
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

interface DownloadStatus {
  decrypted?: boolean
  encrypted?: boolean
}

export const InboxPage: React.FC = () => {
  const { t } = useLanguage()
  const [pendingTransfers, setPendingTransfers] = useState<PendingTransfer[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [activeTransferId, setActiveTransferId] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<'decrypt' | 'bin' | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const [downloadTracker, setDownloadTracker] = useState<Record<string, DownloadStatus>>(() => {
    try {
      const saved = localStorage.getItem('sfs_download_tracker')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const updateDownloadTracker = (transferId: string, update: Partial<DownloadStatus>) => {
    setDownloadTracker(prev => {
      const next = {
        ...prev,
        [transferId]: { ...prev[transferId], ...update },
      }
      try {
        localStorage.setItem('sfs_download_tracker', JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  const fetchPending = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.transfers.pending()
      setPendingTransfers(res.transfers || [])
    } catch (err: any) {
      setError(err.message || t('Failed to load pending transfers.', 'लंबित स्थानांतरण लोड करने में विफल।'))
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
    setStatusMsg(t('Step 1/4: Fetching encrypted blob from server...', 'चरण 1/4: सर्वर से एन्क्रिप्टेड ब्लॉब प्राप्त किया जा रहा है...'))

    try {
      const payload = await api.transfers.deliver(transferId)

      setStatusMsg(t('Step 2/4: Retrieving long-term private key from IndexedDB...', 'चरण 2/4: IndexedDB से दीर्घकालिक निजी कुंजी प्राप्त की जा रही है...'))
      const currentUser = localStorage.getItem('sfs_username') || ''
      const receiverPrivateKey = await getStoredPrivateKey(currentUser)
      if (!receiverPrivateKey) {
        throw new Error(
          t(
            'Long-term private key missing from IndexedDB! Please restore key on Register page.',
            'IndexedDB में दीर्घकालिक निजी कुंजी नहीं मिली! कृपया पंजीकरण पृष्ठ पर कुंजी पुनर्स्थापित करें।'
          )
        )
      }

      setStatusMsg(t('Step 3/4: Deriving 256-bit transfer key with HKDF-SHA256...', 'चरण 3/4: HKDF-SHA256 के साथ 256-बिट स्थानांतरण कुंजी व्युत्पन्न की जा रही है...'))
      const transferKey = await deriveTransferKey(receiverPrivateKey, payload.sender_ephemeral_public_key)

      setStatusMsg(t('Step 4/4: Decrypting ciphertext & verifying AES-256-GCM auth tag...', 'चरण 4/4: सिफ़रटेक्स्ट डिक्रिप्ट करना और AES-256-GCM ऑथ टैग सत्यापित करना...'))
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
      setStatusMsg(
        t(
          `Decryption successful! "${filename}" downloaded. The transfer is retained in your inbox so you can also download the raw encrypted file, or click Remove when done.`,
          `डिक्रिप्शन सफल! "${filename}" डाउनलोड हो गई। स्थानांतरण आपके इनबॉक्स में सुरक्षित है ताकि आप रॉ एन्क्रिप्टेड फ़ाइल भी डाउनलोड कर सकें, या पूरा होने पर हटाएं क्लिक करें।`
        )
      )
    } catch (err: any) {
      setError(err.message || t('Decryption or download failed.', 'डिक्रिप्शन या डाउनलोड विफल रहा।'))
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
    setStatusMsg(t('Step 1/2: Fetching raw ciphertext payload from server...', 'चरण 1/2: सर्वर से रॉ सिफ़रटेक्स्ट पेलोड प्राप्त किया जा रहा है...'))

    try {
      const payload = await api.transfers.deliver(transferId)

      setStatusMsg(t('Step 2/2: Packaging raw ciphertext blob (.bin)...', 'चरण 2/2: रॉ सिफ़रटेक्स्ट ब्लॉब (.bin) पैकेजिंग की जा रही है...'))
      const binaryString = atob(payload.ciphertext)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const originalName = payload.original_filename ? payload.original_filename.replace(/\.[^/.]+$/, '') : `transfer_${transferId.slice(0, 8)}`
      const binFilename = `${originalName}_encrypted.bin`
      triggerDownload(new Blob([bytes], { type: 'application/octet-stream' }), binFilename)

      await api.transfers.downloadAck(transferId, { success: true })
      updateDownloadTracker(transferId, { encrypted: true })
      setStatusMsg(
        t(
          `Encrypted file "${binFilename}" downloaded! The transfer is retained in your inbox so you can also decrypt & download, or click Remove when done.`,
          `एन्क्रिप्टेड फ़ाइल "${binFilename}" डाउनलोड हो गई! स्थानांतरण आपके इनबॉक्स में सुरक्षित है ताकि आप डिक्रिप्ट एवं डाउनलोड भी कर सकें, या पूरा होने पर हटाएं क्लिक करें।`
        )
      )
    } catch (err: any) {
      setError(err.message || t('Failed to download encrypted file.', 'एन्क्रिप्टेड फ़ाइल डाउनलोड करने में विफल।'))
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
    const confirmMsg = t(
      'Are you sure you want to remove this transfer? The encrypted file will be permanently purged from the server.',
      'क्या आप वाकई इस स्थानांतरण को हटाना चाहते हैं? एन्क्रिप्टेड फ़ाइल सर्वर से स्थायी रूप से मिटा दी जाएगी।'
    )
    if (!window.confirm(confirmMsg)) {
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
      setStatusMsg(t('Transfer removed and server copy permanently purged.', 'स्थानांतरण हटा दिया गया और सर्वर कॉपी स्थायी रूप से मिटा दी गई।'))
    } catch (err: any) {
      setError(err.message || t('Failed to remove transfer from server.', 'सर्वर से स्थानांतरण हटाने में विफल।'))
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="page-shell" style={{ padding: '1.5rem 1rem' }}>
      {/* Breadcrumb Trail */}
      <nav aria-label="Breadcrumb" style={{ fontSize: '0.82rem', color: '#606060', marginBottom: '1rem' }}>
        <Link to="/" style={{ color: '#214AAB', textDecoration: 'none' }}>{t('Home', 'होम')}</Link>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span style={{ color: '#150202', fontWeight: 600 }}>{t('Recipient Inbox', 'प्राप्तकर्ता इनबॉक्स')}</span>
      </nav>

      <div className="glass-card" style={{ background: '#FFFFFF', border: '1px solid #EBEAEA', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#162F6A', margin: '0 0 0.35rem' }}>
              {t('Recipient Inbox & Pending Transfers', 'प्राप्तकर्ता इनबॉक्स एवं लंबित स्थानांतरण')}
            </h1>
            <p style={{ color: '#606060', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
              {t(
                'Decrypt incoming transfers locally in your browser using your hardware-stored private key.',
                'अपने स्थानीय रूप से संग्रहीत निजी कुंजी का उपयोग करके अपने ब्राउज़र में आने वाले स्थानांतरणों को डिक्रिप्ट करें।'
              )}
            </p>
          </div>
          <button
            onClick={fetchPending}
            className="btn-secondary"
            style={{ padding: '0.5rem 1rem', background: '#FFFFFF', border: '1px solid #C6C6C6', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#150202' }}
          >
            {t('↻ Refresh Inbox', '↻ इनबॉक्स रीफ्रेश करें')}
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {statusMsg && <div className="alert alert-success">{statusMsg}</div>}

        {loading ? (
          <div className="empty-state">{t('Loading pending encrypted transfers...', 'लंबित एन्क्रिप्टेड स्थानांतरण लोड हो रहे हैं...')}</div>
        ) : pendingTransfers.length === 0 ? (
          <div className="empty-state">{t('No pending transfers queued for your account.', 'आपके खाते के लिए कोई लंबित स्थानांतरण कतार में नहीं है।')}</div>
        ) : (
          <div className="table-container" style={{ border: '1px solid #EBEAEA', borderRadius: '8px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #EBEAEA' }}>
                  <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>{t('Sender', 'प्रेषक')}</th>
                  <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>{t('Transfer ID', 'स्थानांतरण आईडी')}</th>
                  <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>{t('File Size', 'फ़ाइल आकार')}</th>
                  <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>{t('Status', 'स्थिति')}</th>
                  <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A', minWidth: '320px' }}>{t('Actions', 'क्रियाएं')}</th>
                </tr>
              </thead>
              <tbody>
                {pendingTransfers.map(item => {
                  const isProcessing = activeTransferId === item.transfer_id
                  const isRemoving = removingId === item.transfer_id
                  const tracker = downloadTracker[item.transfer_id] || {}

                  return (
                    <tr key={item.transfer_id} style={{ borderBottom: '1px solid #EBEAEA' }}>
                      {/* Left-aligned text */}
                      <td style={{ textAlign: 'left', padding: '0.85rem 1rem', color: '#150202', fontWeight: 600 }}>
                        {item.sender}
                      </td>
                      {/* Monospace Identifier */}
                      <td style={{ textAlign: 'left', padding: '0.85rem 1rem', color: '#606060', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                        {item.transfer_id.slice(0, 18)}...
                      </td>
                      {/* Right-aligned numbers */}
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
                              {t('Decrypted ✓', 'डिक्रिप्टेड ✓')}
                            </span>
                          )}
                          {tracker.encrypted && (
                            <span style={{ background: '#D2DFFF', color: '#162F6A', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                              {t('Ciphertext (.bin) ✓', 'सिफ़रटेक्स्ट (.bin) ✓')}
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
                          {/* Decrypt & Download */}
                          <button
                            className="btn-primary"
                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', backgroundColor: '#214AAB' }}
                            disabled={isProcessing || isRemoving}
                            onClick={() => handleDecryptAndDownload(item.transfer_id)}
                            title={t('Decrypt client-side using private key and download original file', 'निजी कुंजी का उपयोग करके क्लाइंट-साइड डिक्रिप्ट करें और मूल फ़ाइल डाउनलोड करें')}
                          >
                            {isProcessing && activeAction === 'decrypt' ? t('Decrypting...', 'डिक्रिप्ट हो रहा है...') : t('Decrypt & Download', 'डिक्रिप्ट एवं डाउनलोड')}
                          </button>

                          {/* Download Raw Ciphertext */}
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', background: '#FFFFFF', border: '1px solid #C6C6C6' }}
                            disabled={isProcessing || isRemoving}
                            onClick={() => handleDownloadEncryptedBin(item.transfer_id)}
                            title={t('Download raw ciphertext blob without decrypting', 'बिना डिक्रिप्ट किए रॉ सिफ़रटेक्स्ट ब्लॉब डाउनलोड करें')}
                          >
                            {isProcessing && activeAction === 'bin' ? t('Downloading...', 'डाउनलोड हो रहा है...') : t('Download (.bin)', 'डाउनलोड (.bin)')}
                          </button>

                          {/* Secondary action with warning */}
                          <button
                            className="btn-danger"
                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', background: '#FFFFFF', border: '1px solid #DC3545', color: '#DC3545' }}
                            disabled={isProcessing || isRemoving}
                            onClick={() => handleRemoveTransfer(item.transfer_id)}
                            title={t('Permanently remove transfer and purge file from server', 'स्थानांतरण को स्थायी रूप से हटाएं और सर्वर से फ़ाइल मिटाएं')}
                          >
                            {isRemoving ? t('Purging...', 'मिटाया जा रहा है...') : t('Remove', 'हटाएं')}
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
