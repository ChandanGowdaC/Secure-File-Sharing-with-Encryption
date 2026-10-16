import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { getStoredPrivateKey, storePrivateKey } from '../crypto/keystore'
import { deriveTransferKey } from '../crypto/hkdf'
import { decryptFile } from '../crypto/aes-gcm'
import { generateLongTermKeyPair } from '../crypto/keypair'
import { useLanguage } from '../context/LanguageContext'

interface PendingTransfer {
  transfer_id: string
  sender: string
  receiver: string
  status: string
  file_size_bytes?: number | null
  encryption_time_ms?: number | null
  decryption_time_ms?: number | null
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

interface DownloadStatus {
  decrypted?: boolean
  encrypted?: boolean
  decryptionTimeMs?: number | null
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

  // Key Vault & Recovery States
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false)
  const [currentStoredKey, setCurrentStoredKey] = useState<string | null>(null)
  const [importKeyText, setImportKeyText] = useState<string>('')
  const [keyModalMsg, setKeyModalMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isKeyActionLoading, setIsKeyActionLoading] = useState<boolean>(false)
  const [copiedKey, setCopiedKey] = useState<boolean>(false)

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

  const refreshLocalKey = async (): Promise<string | null> => {
    let user = localStorage.getItem('sfs_username') || ''
    if (!user) {
      try {
        const me = await api.auth.me()
        if (me && me.username) {
          user = me.username
          localStorage.setItem('sfs_username', me.username)
        }
      } catch {
        // ignore
      }
    }
    let key = await getStoredPrivateKey(user)
    if (!key) {
      key = await getStoredPrivateKey()
    }
    setCurrentStoredKey(key)
    return key
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
    refreshLocalKey()
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

      setStatusMsg(t('Step 2/4: Retrieving long-term private key from browser vault...', 'चरण 2/4: ब्राउज़र वॉल्ट से दीर्घकालिक निजी कुंजी प्राप्त की जा रही है...'))
      const receiverPrivateKey = await refreshLocalKey()
      if (!receiverPrivateKey) {
        setShowKeyModal(true)
        throw new Error(
          t(
            'Long-term private key missing from this browser! The Key Vault modal has opened so you can restore your backup key or regenerate a new keypair.',
            'इस ब्राउज़र में दीर्घकालिक निजी कुंजी नहीं मिली! कुंजी वॉल्ट मोडल खुल गया है ताकि आप अपनी बैकअप कुंजी पुनर्स्थापित कर सकें या नया कीपेयर बना सकें।'
          )
        )
      }

      setStatusMsg(t('Step 3/4: Deriving 256-bit transfer key with HKDF-SHA256...', 'चरण 3/4: HKDF-SHA256 के साथ 256-बिट स्थानांतरण कुंजी व्युत्पन्न की जा रही है...'))
      // Measure client-side cryptographic decryption and tag verification duration
      const t0 = performance.now()
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
      const t1 = performance.now()
      const decDurationMs = Math.round((t1 - t0) * 100) / 100

      const filename = payload.original_filename || `decrypted_${transferId.slice(0, 8)}.txt`
      triggerDownload(new Blob([decryptedBuffer]), filename)

      await api.transfers.downloadAck(transferId, {
        success: true,
        decryption_time_ms: decDurationMs,
      })
      updateDownloadTracker(transferId, { decrypted: true, decryptionTimeMs: decDurationMs })
      setPendingTransfers(prev =>
        prev.map(item =>
          item.transfer_id === transferId
            ? { ...item, decryption_time_ms: decDurationMs }
            : item
        )
      )
      setStatusMsg(
        t(
          `Decryption successful in ${decDurationMs} ms! "${filename}" downloaded. The transfer is retained in your inbox so you can also download the raw encrypted file, or click Remove when done.`,
          `${decDurationMs} ms में डिक्रिप्शन सफल! "${filename}" डाउनलोड हो गई। स्थानांतरण आपके इनबॉक्स में सुरक्षित है ताकि आप रॉ एन्क्रिप्टेड फ़ाइल भी डाउनलोड कर सकें, या पूरा होने पर हटाएं क्लिक करें।`
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

  const handleCopyKey = () => {
    if (!currentStoredKey) return
    navigator.clipboard.writeText(currentStoredKey)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2500)
  }

  const handleDownloadKeyBackup = () => {
    if (!currentStoredKey) return
    const user = localStorage.getItem('sfs_username') || 'user'
    const blob = new Blob([currentStoredKey], { type: 'application/json' })
    triggerDownload(blob, `${user}_private_key_backup.json`)
  }

  const handleImportKey = async () => {
    setKeyModalMsg(null)
    const trimmed = importKeyText.trim()
    if (!trimmed) {
      setKeyModalMsg({
        type: 'error',
        text: t('Please paste a valid JSON private key JWK string.', 'कृपया एक मान्य JSON निजी कुंजी JWK स्ट्रिंग पेस्ट करें।'),
      })
      return
    }

    try {
      JSON.parse(trimmed)
    } catch {
      setKeyModalMsg({
        type: 'error',
        text: t('Invalid format! The private key must be a valid JSON/JWK string.', 'अमान्य प्रारूप! निजी कुंजी एक मान्य JSON/JWK स्ट्रिंग होनी चाहिए।'),
      })
      return
    }

    setIsKeyActionLoading(true)
    try {
      const user = localStorage.getItem('sfs_username') || ''
      await storePrivateKey(user, trimmed)
      await refreshLocalKey()
      setImportKeyText('')
      setKeyModalMsg({
        type: 'success',
        text: t('Private key restored and saved to browser vault successfully! You can now decrypt incoming transfers.', 'निजी कुंजी सफलतापूर्वक पुनर्स्थापित और ब्राउज़र वॉल्ट में सहेजी गई! अब आप आने वाले स्थानांतरणों को डिक्रिप्ट कर सकते हैं।'),
      })
    } catch (err: any) {
      setKeyModalMsg({
        type: 'error',
        text: err.message || t('Failed to save private key.', 'निजी कुंजी सहेजने में विफल।'),
      })
    } finally {
      setIsKeyActionLoading(false)
    }
  }

  const handleRegenerateKeyPair = async () => {
    const confirmMsg = t(
      '⚠️ Regenerate Cryptographic Identity?\n\nThis will generate a brand new ECDH keypair and update your public key on the server.\n\nNote: Transfers already encrypted with your previous key will not be decryptable with the new key.',
      '⚠️ क्रिप्टोग्राफ़िक पहचान पुनः उत्पन्न करें?\n\nयह एक नया ECDH कुंजी युग्म उत्पन्न करेगा और सर्वर पर आपकी सार्वजनिक कुंजी को अद्यतन करेगा।\n\nनोट: आपकी पिछली कुंजी से पहले से एन्क्रिप्ट किए गए स्थानांतरण नई कुंजी से डिक्रिप्ट नहीं किए जा सकेंगे।'
    )
    if (!window.confirm(confirmMsg)) return

    setIsKeyActionLoading(true)
    setKeyModalMsg(null)
    try {
      const user = localStorage.getItem('sfs_username') || ''
      const keypair = await generateLongTermKeyPair()
      await storePrivateKey(user, keypair.privateKey)
      await api.auth.updatePublicKey({ public_key: keypair.publicKey })
      await refreshLocalKey()
      setKeyModalMsg({
        type: 'success',
        text: t('New cryptographic keypair generated and public key synced with server! You are ready to receive and decrypt new files.', 'नया क्रिप्टोग्राफ़िक कुंजी युग्म उत्पन्न किया गया और सार्वजनिक कुंजी सर्वर के साथ समन्वयित की गई! आप नई फ़ाइलें प्राप्त और डिक्रिप्ट करने के लिए तैयार हैं।'),
      })
    } catch (err: any) {
      setKeyModalMsg({
        type: 'error',
        text: err.message || t('Failed to regenerate keypair or sync with server.', 'कुंजी युग्म पुनः उत्पन्न करने या सर्वर के साथ समन्वयित करने में विफल।'),
      })
    } finally {
      setIsKeyActionLoading(false)
    }
  }

  const handleRemoveTransfer = async (transferId: string) => {
    const confirmMsg = t(
      'Are you sure you want to remove this transfer? The encrypted file will be permanently purged from the server, allowing the sender to send you another file.',
      'क्या आप वाकई इस स्थानांतरण को हटाना चाहते हैं? एन्क्रिप्टेड फ़ाइल सर्वर से स्थायी रूप से हटा दी जाएगी, जिससे प्रेषक आपको दूसरी फ़ाइल भेज सकेगा।'
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
      setStatusMsg(
        t(
          'Transfer removed and server copy permanently purged. The sender can now send a new file.',
          'स्थानांतरण हटा दिया गया और सर्वर कॉपी स्थायी रूप से मिटा दी गई। प्रेषक अब एक नई फ़ाइल भेज सकता है।'
        )
      )
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
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setKeyModalMsg(null)
                setShowKeyModal(true)
                refreshLocalKey()
              }}
              className="btn-secondary"
              style={{
                padding: '0.5rem 1rem',
                background: currentStoredKey ? '#F8FAFC' : '#FFF3CD',
                border: currentStoredKey ? '1px solid #C6C6C6' : '1px solid #FFE69C',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: currentStoredKey ? '#150202' : '#664D03',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
              title={t('Manage hardware-stored ECDH private keys and backups', 'हार्डवेयर-संग्रहीत ECDH निजी कुंजियों और बैकअप का प्रबंधन करें')}
            >
              <span>🔑</span>
              {currentStoredKey ? t('Key Vault & Backup', 'कुंजी वॉल्ट एवं बैकअप') : t('⚠️ Restore Private Key', '⚠️ निजी कुंजी पुनर्स्थापित करें')}
            </button>

            <button
              onClick={fetchPending}
              className="btn-secondary"
              style={{ padding: '0.5rem 1rem', background: '#FFFFFF', border: '1px solid #C6C6C6', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#150202' }}
            >
              {t('↻ Refresh Inbox', '↻ इनबॉक्स रीफ्रेश करें')}
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {statusMsg && <div className="alert alert-success">{statusMsg}</div>}

        {!currentStoredKey && (
          <div
            className="alert alert-warning"
            style={{
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <strong>{t('⚠️ Private Key Missing from this Browser:', '⚠️ इस ब्राउज़र में निजी कुंजी नहीं मिली:')}</strong>{' '}
              {t(
                'Transfers cannot be decrypted without your local private key. If you switched browsers or cleared site data, restore your backup key or regenerate a new keypair.',
                'आपकी स्थानीय निजी कुंजी के बिना स्थानांतरणों को डिक्रिप्ट नहीं किया जा सकता। यदि आपने ब्राउज़र बदला है या साइट डेटा साफ़ किया है, तो अपनी बैकअप कुंजी पुनर्स्थापित करें या नया कुंजी युग्म बनाएं।'
              )}
            </div>
            <button
              onClick={() => {
                setKeyModalMsg(null)
                setShowKeyModal(true)
                refreshLocalKey()
              }}
              className="btn-primary"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', backgroundColor: '#214AAB' }}
            >
              {t('Open Key Vault', 'कुंजी वॉल्ट खोलें')}
            </button>
          </div>
        )}

        {/* Performance Benchmarking Explanation */}
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem',
            fontSize: '0.82rem',
            color: '#475569',
            lineHeight: 1.5,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#162F6A', marginBottom: '4px' }}>
            <span>⏱️</span>
            <span>{t('Client-Side Cryptographic Timing (Enc / Dec)', 'क्लाइंट-साइड क्रिप्टोग्राफ़िक समय (एन्क्र / डिक्र)')}</span>
          </div>
          <div>
            <strong>{t('What is measured?', 'क्या मापा जाता है?')}</strong>{' '}
            {t(
              'High-resolution client-side browser timers (performance.now()) measure pure cryptographic execution: 🔒 Enc is sender duration (HKDF key derivation + AES-256-GCM authenticated cipher encryption). ⚡ Dec is receiver duration (HKDF session key derivation + AES-256-GCM deciphering and 128-bit authentication tag verification). Network latency and disk I/O are completely excluded.',
              'उच्च-रिज़ॉल्यूशन क्लाइंट-साइड ब्राउज़र टाइमर (performance.now()) शुद्ध क्रिप्टोग्राफ़िक निष्पादन को मापते हैं: 🔒 एन्क्र प्रेषक अवधि है (HKDF कुंजी व्युत्पत्ति + AES-256-GCM प्रमाणीकृत सिफ़र एन्क्रिप्शन)। ⚡ डिक्र प्राप्तकर्ता अवधि है (HKDF सत्र कुंजी व्युत्पत्ति + AES-256-GCM डिक्रिप्शन और 128-बिट प्रमाणीकरण टैग सत्यापन)। नेटवर्क विलंबता और डिस्क I/O पूरी तरह से बाहर हैं।'
            )}
          </div>
        </div>

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
                  <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>{t('Crypto Timing (Enc / Dec)', 'क्रिप्टो समय (एन्क्र / डिक्र)')}</th>
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
                          {formatFileSize(item.file_size_bytes || 0)}
                        </span>
                      </td>
                      {/* Crypto Timing (Enc / Dec) */}
                      <td style={{ textAlign: 'center', padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                          <span
                            style={{
                              background: item.encryption_time_ms != null ? '#EFF6FF' : '#F1F5F9',
                              border: item.encryption_time_ms != null ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                              color: item.encryption_time_ms != null ? '#1E40AF' : '#64748B',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              fontFamily: 'monospace',
                              whiteSpace: 'nowrap',
                            }}
                            title={t(
                              'Sender browser encryption duration (HKDF-SHA256 + AES-256-GCM)',
                              'प्रेषक ब्राउज़र एन्क्रिप्शन अवधि (HKDF-SHA256 + AES-256-GCM)'
                            )}
                          >
                            🔒 {t('Enc:', 'एन्क्र:')} {item.encryption_time_ms != null ? `${item.encryption_time_ms} ms` : 'N/A'}
                          </span>
                          {(() => {
                            const decTime = item.decryption_time_ms ?? tracker.decryptionTimeMs
                            const isDec = tracker.decrypted || decTime != null
                            return (
                              <span
                                style={{
                                  background: decTime != null ? '#F0FDF4' : isDec ? '#ECFDF5' : '#F8FAFC',
                                  border: decTime != null ? '1px solid #BBF7D0' : isDec ? '1px solid #A7F3D0' : '1px dashed #CBD5E1',
                                  color: decTime != null ? '#15803D' : isDec ? '#047857' : '#94A3B8',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  fontFamily: 'monospace',
                                  whiteSpace: 'nowrap',
                                }}
                                title={t(
                                  'Receiver browser decryption duration (HKDF-SHA256 + AES-256-GCM tag verification)',
                                  'प्राप्तकर्ता ब्राउज़र डिक्रिप्शन अवधि (HKDF-SHA256 + AES-256-GCM टैग सत्यापन)'
                                )}
                              >
                                ⚡ {t('Dec:', 'डिक्र:')} {decTime != null ? `${decTime} ms` : isDec ? t('Verified', 'सत्यापित') : t('Pending', 'लंबित')}
                              </span>
                            )
                          })()}
                        </div>
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

      {/* Key Vault Modal */}
      {showKeyModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(21, 2, 2, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
            padding: '1rem',
          }}
          onClick={() => setShowKeyModal(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '2px solid #EBEAEA',
              borderRadius: '12px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem',
              boxShadow: '0 12px 36px rgba(0,0,0,0.18)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🔑</span>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#162F6A' }}>
                    {t('Cryptographic Key Vault', 'क्रिप्टोग्राफ़िक कुंजी वॉल्ट')}
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#606060' }}>
                    {t('Zero-Knowledge Client Storage (IndexedDB & Local Hardware Vault)', 'ज़ीरो-नॉलेज क्लाइंट स्टोरेज (IndexedDB एवं स्थानीय हार्डवेयर वॉल्ट)')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.4rem',
                  cursor: 'pointer',
                  color: '#606060',
                  padding: '4px',
                }}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {keyModalMsg && (
              <div className={`alert alert-${keyModalMsg.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: '1rem' }}>
                {keyModalMsg.text}
              </div>
            )}

            {/* Key Status Pill */}
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: currentStoredKey ? '#E6F4EA' : '#FFF3CD',
                border: currentStoredKey ? '1px solid #198754' : '1px solid #FFE69C',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{currentStoredKey ? '🔒' : '⚠️'}</span>
                <div>
                  <strong style={{ color: currentStoredKey ? '#198754' : '#664D03', fontSize: '0.88rem' }}>
                    {currentStoredKey ? t('Private Key Stored & Active in this Browser', 'इस ब्राउज़र में निजी कुंजी संग्रहीत एवं सक्रिय है') : t('No Private Key Detected in this Browser', 'इस ब्राउज़र में कोई निजी कुंजी नहीं मिली')}
                  </strong>
                  <div style={{ fontSize: '0.78rem', color: currentStoredKey ? '#0f5132' : '#664D03' }}>
                    {currentStoredKey
                      ? t('Ready to decrypt incoming files sent to your account.', 'आपके खाते में भेजी गई आने वाली फ़ाइलों को डिक्रिप्ट करने के लिए तैयार।')
                      : t('Transfers cannot be decrypted without restoring or generating keys.', 'कुंजी पुनर्स्थापित या उत्पन्न किए बिना स्थानांतरण डिक्रिप्ट नहीं हो सकते।')}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1: Backup Private Key (Export) */}
            {currentStoredKey && (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #EBEAEA', borderRadius: '8px', background: '#F8FAFC' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#162F6A' }}>
                  {t('1. Backup / Export Active Private Key', '1. सक्रिय निजी कुंजी का बैकअप / निर्यात')}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#606060', margin: '0 0 0.75rem', lineHeight: 1.4 }}>
                  {t('Copy or download your private key JWK so you can decrypt files on another browser or device.', 'अपनी निजी कुंजी JWK कॉपी या डाउनलोड करें ताकि आप अन्य ब्राउज़र पर फ़ाइलों को डिक्रिप्ट कर सकें।')}
                </p>
                <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                  <textarea
                    readOnly
                    value={currentStoredKey}
                    rows={3}
                    style={{
                      width: '100%',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      padding: '0.5rem',
                      background: '#FFFFFF',
                      border: '1px solid #C6C6C6',
                      borderRadius: '4px',
                      color: '#150202',
                      resize: 'none',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleCopyKey}
                    className="btn-secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: '#FFFFFF', border: '1px solid #C6C6C6' }}
                  >
                    {copiedKey ? t('✓ Copied to Clipboard!', '✓ क्लिपबोर्ड पर कॉपी हुआ!') : t('📋 Copy Key to Clipboard', '📋 कुंजी क्लिपबोर्ड पर कॉपी करें')}
                  </button>
                  <button
                    onClick={handleDownloadKeyBackup}
                    className="btn-secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: '#FFFFFF', border: '1px solid #C6C6C6' }}
                  >
                    {t('⬇️ Download Key File (.json)', '⬇️ कुंजी फ़ाइल डाउनलोड करें (.json)')}
                  </button>
                </div>
              </div>
            )}

            {/* Section 2: Restore from Backup */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #EBEAEA', borderRadius: '8px', background: '#FFFFFF' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#162F6A' }}>
                {t('2. Restore Private Key from Backup', '2. बैकअप से निजी कुंजी पुनर्स्थापित करें')}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#606060', margin: '0 0 0.75rem', lineHeight: 1.4 }}>
                {t('Paste your backed-up private key JWK JSON to restore decryption capabilities on this browser.', 'इस ब्राउज़र पर डिक्रिप्शन क्षमताएं पुनर्स्थापित करने के लिए अपनी बैकअप निजी कुंजी JWK JSON पेस्ट करें।')}
              </p>
              <textarea
                placeholder={t('Paste JSON private key JWK here... (e.g. {"kty":"EC", ...})', 'यहाँ JSON निजी कुंजी JWK पेस्ट करें...')}
                value={importKeyText}
                onChange={e => setImportKeyText(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  fontFamily: 'monospace',
                  fontSize: '0.78rem',
                  padding: '0.5rem',
                  background: '#FFFFFF',
                  border: '1px solid #C6C6C6',
                  borderRadius: '4px',
                  color: '#150202',
                  marginBottom: '0.65rem',
                }}
              />
              <button
                onClick={handleImportKey}
                disabled={isKeyActionLoading || !importKeyText.trim()}
                className="btn-primary"
                style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem', backgroundColor: '#214AAB' }}
              >
                {isKeyActionLoading ? t('Saving...', 'सहेजा जा रहा है...') : t('📥 Restore & Save to Browser Vault', '📥 पुनर्स्थापित करें एवं ब्राउज़र वॉल्ट में सहेजें')}
              </button>
            </div>

            {/* Section 3: Regenerate Keypair & Sync */}
            <div style={{ padding: '1rem', border: '1px solid #EBEAEA', borderRadius: '8px', background: '#FFF8F8' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#842029' }}>
                {t('3. Regenerate Keypair & Sync to Server', '3. कुंजी युग्म पुनः उत्पन्न करें एवं सर्वर पर सिंक करें')}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#606060', margin: '0 0 0.75rem', lineHeight: 1.4 }}>
                {t(
                  'If you lost your private key and have no backup, generate a fresh cryptographic identity. Your new public key will be registered with the server immediately.',
                  'यदि आपकी निजी कुंजी खो गई है और कोई बैकअप नहीं है, तो एक नई क्रिप्टोग्राफ़िक पहचान बनाएं। आपकी नई सार्वजनिक कुंजी तुरंत सर्वर पर पंजीकृत की जाएगी।'
                )}
              </p>
              <button
                onClick={handleRegenerateKeyPair}
                disabled={isKeyActionLoading}
                className="btn-danger"
                style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem', background: '#FFFFFF', border: '1px solid #DC3545', color: '#DC3545' }}
              >
                {isKeyActionLoading ? t('Generating & Syncing...', 'उत्पन्न और सिंक हो रहा है...') : t('🔄 Generate New Keypair & Sync Public Key', '🔄 नया कुंजी युग्म बनाएं एवं सार्वजनिक कुंजी सिंक करें')}
              </button>
            </div>

            <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
              <button
                onClick={() => setShowKeyModal(false)}
                className="btn-secondary"
                style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem', background: '#FFFFFF', border: '1px solid #C6C6C6' }}
              >
                {t('Close Vault', 'वॉल्ट बंद करें')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
