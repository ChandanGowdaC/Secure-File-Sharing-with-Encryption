import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

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
      "⚠️ DANGER: COMPLETE DATABASE WIPE\n\n" +
      "This will permanently delete:\n" +
      "• ALL registered users\n" +
      "• ALL pending & completed file transfers\n" +
      "• ALL user activity logs & forensic audits\n" +
      "• ALL local encrypted blob files\n\n" +
      "This cannot be undone. Are you sure?"
    )
    if (!confirmed) return

    setWipingDb(true)
    setError(null)
    setWipeNotice(null)
    try {
      const res = await api.admin.resetDatabase()
      setWipeNotice(res.message || "Database wiped cleanly. All tables have been re-initialized.")
      await fetchData()
    } catch (err: any) {
      setError(err.message || "Failed to reset database.")
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
      setError(`Failed to download report for ${username}: ${err.message}`)
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
      setError(err.message || 'Failed to fetch administrative audit records')
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
      {/* Breadcrumb Trail (DBIM Section 4.5.ii) */}
      <nav aria-label="Breadcrumb" style={{ fontSize: '0.82rem', color: '#606060', marginBottom: '1rem' }}>
        <Link to="/" style={{ color: '#214AAB', textDecoration: 'none' }}>Home</Link>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span style={{ color: '#214AAB', textDecoration: 'none' }}>Ministry</span>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span style={{ color: '#150202', fontWeight: 600 }}>Forensic Audit &amp; Administration</span>
      </nav>

      <section className="page-hero admin-hero" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div style={{ color: '#214AAB', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Metadata-Only Forensic Audit &amp; Security Oversight
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#162F6A', margin: '0 0 0.5rem' }}>
            System Audit &amp; Administrative Governance
          </h1>
          <p style={{ color: '#606060', fontSize: '0.92rem', margin: 0, lineHeight: 1.5 }}>
            Review registered user identities, track session access timestamps, inspect forensic activity trails, and generate official enquiry reports.
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
          Registered Users ({users.length})
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
          Activity Logs
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
          Transfer Audit Logs
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
          title="Permanently wipe all database tables, users, transfers, and audit logs"
        >
          {wipingDb ? 'Wiping Database...' : 'Reset Database Tables'}
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
                ? 'Search users by username or email...'
                : activeTab === 'activities'
                ? 'Filter by username, action, or details...'
                : 'Filter by sender, receiver, or transfer ID...'
            }
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <div style={{ color: '#606060', fontSize: '0.85rem' }}>
            Showing{' '}
            <strong style={{ color: '#162F6A' }}>
              {activeTab === 'users'
                ? filteredUsers.length
                : activeTab === 'activities'
                ? filteredActivities.length
                : filteredLogs.length}
            </strong>{' '}
            records
          </div>
        </div>

        {/* TAB 1: USERS LIST (Table conforms to DBIM Section 4.1.1.i) */}
        {activeTab === 'users' && (
          loading ? (
            <div className="empty-state">Loading registered users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state">No users found matching search criteria.</div>
          ) : (
            <div className="table-container" style={{ border: '1px solid #EBEAEA', borderRadius: '8px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #EBEAEA' }}>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>Username</th>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>Email</th>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>Role</th>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>Registered At</th>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>Last Login</th>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>Forensic Report</th>
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
                            Administrator
                          </span>
                        ) : (
                          <span style={{ background: '#F8FAFC', color: '#606060', border: '1px solid #EBEAEA', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                            Citizen User
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', padding: '0.85rem 1rem', color: '#606060', fontSize: '0.85rem' }}>
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB') : '-'}
                      </td>
                      <td style={{ textAlign: 'right', padding: '0.85rem 1rem' }}>
                        {user.last_login_at ? (
                          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.82rem', alignItems: 'flex-end' }}>
                            <span style={{ fontWeight: 600, color: '#150202' }}>
                              {new Date(user.last_login_at).toLocaleDateString('en-GB')}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#606060' }}>
                              {new Date(user.last_login_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#8E8E8E', fontSize: '0.78rem' }}>Never</span>
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
                            View Logs
                          </button>
                          <button
                            className="btn-primary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', backgroundColor: '#214AAB' }}
                            disabled={downloadingPdf === user.username}
                            onClick={() => handleGeneratePdf(user.username)}
                          >
                            {downloadingPdf === user.username ? 'Generating...' : 'Export PDF'}
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

        {/* TAB 2: SYSTEM ACTIVITY LOGS (Table conforms to DBIM Section 4.1.1.i) */}
        {activeTab === 'activities' && (
          loading ? (
            <div className="empty-state">Loading user activity log records...</div>
          ) : filteredActivities.length === 0 ? (
            <div className="empty-state">No activity logs found matching filter.</div>
          ) : (
            <div className="table-container" style={{ border: '1px solid #EBEAEA', borderRadius: '8px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #EBEAEA' }}>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>Timestamp</th>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>User</th>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>Action</th>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>Details</th>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>Report</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map(entry => (
                    <tr key={entry.id} style={{ borderBottom: '1px solid #EBEAEA' }}>
                      <td style={{ textAlign: 'right', padding: '0.85rem 1rem', color: '#606060', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {new Date(entry.timestamp).toLocaleString('en-GB')}
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

        {/* TAB 3: TRANSFER AUDIT LOGS (Table conforms to DBIM Section 4.1.1.i) */}
        {activeTab === 'transfers' && (
          loading ? (
            <div className="empty-state">Loading file audit logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="empty-state">No file transfer logs found matching filter.</div>
          ) : (
            <div className="table-container" style={{ border: '1px solid #EBEAEA', borderRadius: '8px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #EBEAEA' }}>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>Timestamp</th>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>Transfer ID</th>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>Sender</th>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>Receiver</th>
                    <th style={{ textAlign: 'center', padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#162F6A' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, idx) => (
                    <tr key={`${log.transfer_id}-${idx}`} style={{ borderBottom: '1px solid #EBEAEA' }}>
                      <td style={{ textAlign: 'right', padding: '0.85rem 1rem', color: '#606060', fontSize: '0.82rem' }}>
                        {new Date(log.timestamp).toLocaleString('en-GB')}
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
                          {log.status}
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
