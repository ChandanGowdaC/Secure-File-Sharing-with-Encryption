import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useLanguage } from '../context/LanguageContext'

interface LogEntry {
  transfer_id: string
  sender: string
  receiver: string
  timestamp: string
  status: string
}

interface UserEntry {
  username: string
  email: string
  is_admin: boolean
  last_login_at?: string | null
  created_at: string
}

interface ActivityEntry {
  id: number
  username: string
  action: string
  details?: string | null
  ip_address?: string | null
  timestamp: string
}

function formatActivityDetails(details?: string | null): string {
  if (!details) return '-'
  return details.replace(/(size:\s*)(\d+)(?!\s*[kmgt]?b)/gi, (_, prefix, num) => {
    const bytes = Number(num)
    if (isNaN(bytes) || bytes <= 0) return `${prefix}${num}`
    if (bytes >= 1024 * 1024 * 1024) return `${prefix}${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
    if (bytes >= 1024 * 1024) return `${prefix}${(bytes / (1024 * 1024)).toFixed(2)} MB`
    if (bytes >= 1024) return `${prefix}${(bytes / 1024).toFixed(1)} KB`
    return `${prefix}${bytes} B`
  })
}

export const AdminPage: React.FC = () => {
  const { t, isHindi } = useLanguage()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [users, setUsers] = useState<UserEntry[]>([])
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'transfers' | 'users' | 'activities'>('users')
  const [wipingDb, setWipingDb] = useState(false)
  const [wipeNotice, setWipeNotice] = useState<string | null>(null)

  const handleResetDatabase = async () => {
    const confirmed = window.confirm(
      t(
        "⚠️ DANGER: COMPLETE DATABASE WIPE\n\nThis will permanently delete:\n• ALL registered users\n• ALL pending & completed file transfers\n• ALL user activity logs & forensic audits\n• ALL local encrypted blob files\n\nThis cannot be undone. Are you sure?",
        "⚠️ चेतावनी: पूर्ण डेटाबेस मिटाना\n\nयह स्थायी रूप से हटा देगा:\n• सभी पंजीकृत उपयोगकर्ता\n• सभी लंबित और पूर्ण फ़ाइल स्थानांतरण\n• सभी गतिविधि लॉग\n• सभी स्थानीय एन्क्रिप्टेड फ़ाइलें\n\nइसे पूर्ववत नहीं किया जा सकता। क्या आप सुनिश्चित हैं?"
      )
    )
    if (!confirmed) return

    setWipingDb(true)
    setError(null)
    setWipeNotice(null)
    try {
      const res = await api.admin.resetDatabase()
      setWipeNotice(res.message || t("Database wiped cleanly. All tables have been re-initialized.", "डेटाबेस पूरी तरह से साफ़ कर दिया गया है।"))
      await fetchData()
    } catch (err: any) {
      setError(err.message || t("Failed to reset database.", "डेटाबेस रीसेट करने में विफल।"))
    } finally {
      setWipingDb(false)
    }
  }

  const handleGeneratePdf = async (username: string) => {
    setDownloadingPdf(username)
    setError(null)
    try {
      await api.admin.generatePdf(username)
    } catch (err: any) {
      setError(t(`Failed to download report for ${username}: ${err.message}`, `${username} के लिए रिपोर्ट डाउनलोड करने में विफल: ${err.message}`))
    } finally {
      setDownloadingPdf(null)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [logsRes, usersRes, actRes] = await Promise.all([
        api.admin.logs(),
        api.admin.users(),
        api.admin.activityLogs(),
      ])
      setLogs(logsRes.entries || [])
      setUsers(usersRes.users || [])
      setActivities(actRes.entries || [])
    } catch (err: any) {
      setError(err.message || t('Failed to fetch administrative audit records', 'प्रशासनिक ऑडिट रिकॉर्ड प्राप्त करने में विफल'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredLogs = logs.filter(
    l =>
      !searchQuery ||
      l.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.receiver.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.transfer_id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredUsers = users.filter(
    u =>
      !searchQuery ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredActivities = activities.filter(
    a =>
      !searchQuery ||
      a.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.details && a.details.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="page-shell" style={{ padding: '1.5rem 1rem' }}>
      {/* Breadcrumb Trail */}
      <nav aria-label="Breadcrumb" style={{ fontSize: '0.82rem', color: '#606060', marginBottom: '1rem' }}>
        <Link to="/" style={{ color: '#214AAB', textDecoration: 'none' }}>{t('Home', 'होम')}</Link>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span style={{ color: '#214AAB', textDecoration: 'none' }}>{t('Administration', 'प्रशासन')}</span>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span style={{ color: '#150202', fontWeight: 600 }}>{t('Audit & Security Administration', 'ऑडिट और सुरक्षा प्रशासन')}</span>
      </nav>

      <section className="page-hero admin-hero" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div style={{ color: '#214AAB', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '4px' }}>
            {t('Metadata-Only Audit & Security Oversight', 'मेटाडेटा-ओनली ऑडिट एवं सुरक्षा पर्यवेक्षण')}
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#162F6A', margin: '0 0 0.5rem' }}>
            {t('System Audit & Security Administration', 'सिस्टम ऑडिट एवं सुरक्षा प्रशासन')}
          </h1>
          <p style={{ color: '#606060', fontSize: '0.92rem', margin: 0, lineHeight: 1.5 }}>
            {t(
              'Review registered user identities, track session access timestamps, inspect forensic activity trails, and generate official enquiry reports.',
              'पंजीकृत उपयोगकर्ताओं की पहचान की समीक्षा करें, सत्र पहुँच समय ट्रैक करें, ऑडिट ट्रेल्स का निरीक्षण करें और आधिकारिक रिपोर्ट तैयार करें।'
            )}
          </p>
        </div>
      </section>

      {error && <div className="alert alert-error">{error}</div>}
      {wipeNotice && <div className="alert alert-success">{wipeNotice}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => { setActiveTab('users'); setSearchQuery('') }}
          style={{
            padding: '0.55rem 1.15rem',
            borderRadius: '6px',
            border: activeTab === 'users' ? '1px solid #214AAB' : '1px solid #C6C6C6',
            backgroundColor: activeTab === 'users' ? '#D2DFFF' : '#FFFFFF',
            color: activeTab === 'users' ? '#162F6A' : '#150202',
            fontWeight: activeTab === 'users' ? 700 : 500,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          {t('Registered Users', 'पंजीकृत उपयोगकर्ता')} ({users.length})
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('activities'); setSearchQuery('') }}
          style={{
            padding: '0.55rem 1.15rem',
            borderRadius: '6px',
            border: activeTab === 'activities' ? '1px solid #214AAB' : '1px solid #C6C6C6',
            backgroundColor: activeTab === 'activities' ? '#D2DFFF' : '#FFFFFF',
            color: activeTab === 'activities' ? '#162F6A' : '#150202',
            fontWeight: activeTab === 'activities' ? 700 : 500,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          {t('Activity Logs', 'गतिविधि लॉग')}
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('transfers'); setSearchQuery('') }}
          style={{
            padding: '0.55rem 1.15rem',
            borderRadius: '6px',
            border: activeTab === 'transfers' ? '1px solid #214AAB' : '1px solid #C6C6C6',
            backgroundColor: activeTab === 'transfers' ? '#D2DFFF' : '#FFFFFF',
            color: activeTab === 'transfers' ? '#162F6A' : '#150202',
            fontWeight: activeTab === 'transfers' ? 700 : 500,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          {t('Transfer Audit Logs', 'स्थानांतरण ऑडिट लॉग')}
        </button>

        <button
          type="button"
          style={{
            marginLeft: 'auto',
            padding: '0.55rem 1.1rem',
            fontSize: '0.82rem',
            fontWeight: 600,
            borderRadius: '6px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #DC3545',
            color: '#DC3545',
            cursor: 'pointer',
          }}
          onClick={handleResetDatabase}
          disabled={wipingDb}
          title={t('Permanently wipe all database tables, users, transfers, and audit logs', 'सभी डेटाबेस तालिकाएँ, उपयोगकर्ता, स्थानांतरण और ऑडिट लॉग स्थायी रूप से मिटाएं')}
        >
          {wipingDb ? t('Wiping Database...', 'डेटाबेस मिटाया जा रहा है...') : t('Reset Database Tables', 'डेटाबेस तालिकाएँ रीसेट करें')}
        </button>
      </div>

      <section className="glass-card" style={{ background: '#FFFFFF', border: '1px solid #EBEAEA', borderRadius: '12px', padding: '1.75rem', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <input
            type="text"
            className="form-control"
            style={{ maxWidth: '380px', backgroundColor: '#FFFFFF', border: '1px solid #C6C6C6' }}
            placeholder={
              activeTab === 'users'
                ? t('Search users by username or email...', 'उपयोगकर्ता नाम या ईमेल द्वारा खोजें...')
                : activeTab === 'activities'
                ? t('Filter by username, action, or details...', 'उपयोगकर्ता नाम, क्रिया या विवरण द्वारा फ़िल्टर करें...')
                : t('Filter by sender, receiver, or transfer ID...', 'प्रेषक, प्राप्तकर्ता या आईडी द्वारा फ़िल्टर करें...')
            }
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <div style={{ color: '#606060', fontSize: '0.85rem' }}>
            {t('Showing', 'प्रदर्शित')}{' '}
            <strong style={{ color: '#162F6A' }}>
              {activeTab === 'users'
                ? filteredUsers.length
                : activeTab === 'activities'
                ? filteredActivities.length
                : filteredLogs.length}
            </strong>{' '}
            {t('records', 'रिकॉर्ड')}
          </div>
        </div>

        {/* TAB 1: USERS LIST */}
        {activeTab === 'users' && (
          loading ? (
            <div className="empty-state">{t('Loading registered users...', 'पंजीकृत उपयोगकर्ता लोड हो रहे हैं...')}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state">{t('No users found matching search criteria.', 'खोज मानदंड से मेल खाने वाला कोई उपयोगकर्ता नहीं मिला।')}</div>
          ) : (
            <div className="table-container" style={{ border: '1px solid #EBEAEA', borderRadius: '8px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #EBEAEA' }}>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>{t('Username', 'उपयोगकर्ता नाम')}</th>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>{t('Email', 'ईमेल')}</th>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>{t('Role', 'भूमिका')}</th>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>{t('Registered At', 'पंजीकरण तिथि')}</th>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>{t('Last Login', 'अंतिम लॉगिन')}</th>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>{t('Audit Report', 'ऑडिट रिपोर्ट')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.username} style={{ borderBottom: '1px solid #EBEAEA' }}>
                      <td style={{ textAlign: 'left', padding: '0.85rem 1rem', fontWeight: 600, color: '#150202' }}>
                        {user.username}
                      </td>
                      <td style={{ textAlign: 'left', padding: '0.85rem 1rem', color: '#606060' }}>{user.email}</td>
                      <td style={{ textAlign: 'center', padding: '0.85rem 1rem' }}>
                        {user.is_admin ? (
                          <span style={{ background: '#D2DFFF', color: '#162F6A', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                            {t('Administrator', 'प्रशासक')}
                          </span>
                        ) : (
                          <span style={{ background: '#F8FAFC', color: '#606060', border: '1px solid #EBEAEA', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {t('Standard User', 'मानक उपयोगकर्ता')}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', padding: '0.85rem 1rem', color: '#606060', fontSize: '0.85rem' }}>
                        {user.created_at ? new Date(user.created_at).toLocaleDateString(isHindi ? 'hi-IN' : 'en-GB') : '-'}
                      </td>
                      <td style={{ textAlign: 'right', padding: '0.85rem 1rem' }}>
                        {user.last_login_at ? (
                          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.82rem', alignItems: 'flex-end' }}>
                            <span style={{ fontWeight: 600, color: '#150202' }}>
                              {new Date(user.last_login_at).toLocaleDateString(isHindi ? 'hi-IN' : 'en-GB')}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#606060' }}>
                              {new Date(user.last_login_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#8E8E8E', fontSize: '0.78rem' }}>{t('Never', 'कभी नहीं')}</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', background: '#FFFFFF', border: '1px solid #C6C6C6' }}
                            onClick={() => {
                              setSearchQuery(user.username)
                              setActiveTab('activities')
                            }}
                          >
                            {t('View Logs', 'लॉग देखें')}
                          </button>
                          <button
                            className="btn-primary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', backgroundColor: '#214AAB' }}
                            disabled={downloadingPdf === user.username}
                            onClick={() => handleGeneratePdf(user.username)}
                          >
                            {downloadingPdf === user.username ? t('Generating...', 'तैयार हो रहा है...') : t('Export PDF', 'पीडीएफ निर्यात')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* TAB 2: SYSTEM ACTIVITY LOGS */}
        {activeTab === 'activities' && (
          loading ? (
            <div className="empty-state">{t('Loading activity log records...', 'गतिविधि लॉग रिकॉर्ड लोड हो रहे हैं...')}</div>
          ) : filteredActivities.length === 0 ? (
            <div className="empty-state">{t('No activity logs found matching filter.', 'फ़िल्टर से मेल खाने वाला कोई गतिविधि लॉग नहीं मिला।')}</div>
          ) : (
            <div className="table-container" style={{ border: '1px solid #EBEAEA', borderRadius: '8px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #EBEAEA' }}>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>{t('Timestamp', 'समय-मुहर')}</th>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>{t('User', 'उपयोगकर्ता')}</th>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>{t('Action', 'क्रिया')}</th>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>{t('Details', 'विवरण')}</th>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>{t('Report', 'रिपोर्ट')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map(entry => (
                    <tr key={entry.id} style={{ borderBottom: '1px solid #EBEAEA' }}>
                      <td style={{ textAlign: 'right', padding: '0.85rem 1rem', color: '#606060', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {new Date(entry.timestamp).toLocaleString(isHindi ? 'hi-IN' : 'en-GB')}
                      </td>
                      <td style={{ textAlign: 'left', padding: '0.85rem 1rem', color: '#150202', fontWeight: 600 }}>
                        {entry.username}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            background:
                              entry.action === 'login'
                                ? '#E6F4EA'
                                : entry.action === 'upload_file'
                                ? '#D2DFFF'
                                : entry.action === 'download_file'
                                ? '#FFFBEB'
                                : '#F8FAFC',
                            color:
                              entry.action === 'login'
                                ? '#198754'
                                : entry.action === 'upload_file'
                                ? '#162F6A'
                                : entry.action === 'download_file'
                                ? '#916100'
                                : '#150202',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          {entry.action}
                        </span>
                      </td>
                      <td style={{ textAlign: 'left', padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#150202' }}>
                        {formatActivityDetails(entry.details)}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.85rem 1rem' }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', background: '#FFFFFF', border: '1px solid #C6C6C6' }}
                          disabled={downloadingPdf === entry.username}
                          onClick={() => handleGeneratePdf(entry.username)}
                        >
                          {downloadingPdf === entry.username ? '...' : 'PDF'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* TAB 3: TRANSFER AUDIT LOGS */}
        {activeTab === 'transfers' && (
          loading ? (
            <div className="empty-state">{t('Loading file audit logs...', 'फ़ाइल ऑडिट लॉग लोड हो रहे हैं...')}</div>
          ) : filteredLogs.length === 0 ? (
            <div className="empty-state">{t('No file transfer logs found matching filter.', 'फ़िल्टर से मेल खाने वाला कोई स्थानांतरण लॉग नहीं मिला।')}</div>
          ) : (
            <div className="table-container" style={{ border: '1px solid #EBEAEA', borderRadius: '8px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #EBEAEA' }}>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>{t('Timestamp', 'समय-मुहर')}</th>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>{t('Transfer ID', 'स्थानांतरण आईडी')}</th>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>{t('Sender', 'प्रेषक')}</th>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>{t('Receiver', 'प्राप्तकर्ता')}</th>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>{t('Status', 'स्थिति')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, idx) => (
                    <tr key={`${log.transfer_id}-${idx}`} style={{ borderBottom: '1px solid #EBEAEA' }}>
                      <td style={{ textAlign: 'right', padding: '0.85rem 1rem', color: '#606060', fontSize: '0.82rem' }}>
                        {new Date(log.timestamp).toLocaleString(isHindi ? 'hi-IN' : 'en-GB')}
                      </td>
                      <td style={{ textAlign: 'left', padding: '0.85rem 1rem', color: '#606060', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                        {log.transfer_id.slice(0, 18)}...
                      </td>
                      <td style={{ textAlign: 'left', padding: '0.85rem 1rem', color: '#150202', fontWeight: 600 }}>{log.sender}</td>
                      <td style={{ textAlign: 'left', padding: '0.85rem 1rem', color: '#150202', fontWeight: 600 }}>{log.receiver}</td>
                      <td style={{ textAlign: 'center', padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            background: log.status === 'pending' ? '#FFFBEB' : '#E6F4EA',
                            color: log.status === 'pending' ? '#916100' : '#198754',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          {log.status === 'pending' ? t('pending', 'लंबित') : t('completed', 'पूर्ण')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </section>
    </div>
  )
}
