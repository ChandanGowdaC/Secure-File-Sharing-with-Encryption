import React, { useEffect, useState } from 'react'
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

export const AdminPage: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [users, setUsers] = useState<UserEntry[]>([])
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'transfers' | 'users' | 'activities'>('users')

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.admin.logs()
      setLogs(res.entries || [])
    } catch (err: any) {
      setError(err.message || 'Access denied. Admin session required.')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.admin.users()
      setUsers(res.users || [])
    } catch (err: any) {
      setError(err.message || 'Access denied. Admin session required.')
    } finally {
      setLoading(false)
    }
  }

  const fetchActivities = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.admin.activityLogs()
      setActivities(res.entries || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load activity logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'transfers') {
      fetchLogs()
    } else if (activeTab === 'users') {
      fetchUsers()
    } else if (activeTab === 'activities') {
      fetchActivities()
    }
  }, [activeTab])

  const handleGeneratePdf = async (username: string) => {
    setDownloadingPdf(username)
    try {
      await api.admin.generatePdf(username)
    } catch (err: any) {
      alert(err.message || 'PDF generation failed')
    } finally {
      setDownloadingPdf(null)
    }
  }

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
    <div className="page-shell">
      <section className="page-hero admin-hero">
        <div>
          <p className="eyebrow" style={{ color: 'var(--primary-accent)' }}>Metadata-only audit & security oversight</p>
          <h1>System Audit & Admin Control</h1>
          <p>
            Review registered users, track last login timestamps, inspect forensic activity trails, and generate official enquiry reports.
          </p>
        </div>
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button
          className={activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => { setActiveTab('users'); setSearchQuery('') }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Registered Users ({users.length})
        </button>
        <button
          className={activeTab === 'activities' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => { setActiveTab('activities'); setSearchQuery('') }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Activity Logs
        </button>
        <button
          className={activeTab === 'transfers' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => { setActiveTab('transfers'); setSearchQuery('') }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Transfer Audit Logs
        </button>
      </div>

      <section className="glass-card admin-panel">
        <div className="admin-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <input
            type="text"
            className="form-control"
            style={{ maxWidth: '380px' }}
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
          <div className="log-count" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Showing{' '}
            <strong>
              {activeTab === 'users'
                ? filteredUsers.length
                : activeTab === 'activities'
                ? filteredActivities.length
                : filteredLogs.length}
            </strong>{' '}
            records
          </div>
        </div>

        {/* TAB 1: USERS LIST */}
        {activeTab === 'users' && (
          loading ? (
            <div className="empty-state">Loading registered users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state">No users found matching search criteria.</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Registered At</th>
                    <th>Last Login Details</th>
                    <th>Forensic Report</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.username}>
                      <td>
                        <span style={{ fontWeight: 600 }}>{user.username}</span>
                      </td>
                      <td className="muted-cell">{user.email}</td>
                      <td>
                        {user.is_admin ? (
                          <span className="badge badge-admin">Administrator</span>
                        ) : (
                          <span className="badge badge-pending" style={{ background: '#f1f5f9', color: '#475569' }}>
                            User
                          </span>
                        )}
                      </td>
                      <td className="muted-cell">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                      </td>
                      <td>
                        {user.last_login_at ? (
                          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem' }}>
                            <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                              {new Date(user.last_login_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {new Date(user.last_login_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <span className="badge" style={{ background: '#f8fafc', color: '#94a3b8', border: '1px dashed #cbd5e1' }}>
                            Never Logged In
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                            onClick={() => {
                              setSearchQuery(user.username)
                              setActiveTab('activities')
                            }}
                          >
                            View Logs
                          </button>
                          <button
                            className="btn-primary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                            disabled={downloadingPdf === user.username}
                            onClick={() => handleGeneratePdf(user.username)}
                          >
                            {downloadingPdf === user.username ? (
                              'Generating...'
                            ) : (
                              <>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                                Export PDF
                              </>
                            )}
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
            <div className="empty-state">Loading user activity log records...</div>
          ) : filteredActivities.length === 0 ? (
            <div className="empty-state">No activity logs found matching filter.</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp (UTC)</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Details</th>
                    <th>Report</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map(entry => (
                    <tr key={entry.id}>
                      <td className="muted-cell" style={{ whiteSpace: 'nowrap' }}>
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                      <td>
                        <strong>{entry.username}</strong>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background:
                              entry.action === 'login'
                                ? '#dcfce7'
                                : entry.action === 'upload_file'
                                ? '#e0e7ff'
                                : entry.action === 'download_file'
                                ? '#fef3c7'
                                : entry.action === 'delete_account'
                                ? '#fee2e2'
                                : '#f1f5f9',
                            color:
                              entry.action === 'login'
                                ? '#166534'
                                : entry.action === 'upload_file'
                                ? '#4338ca'
                                : entry.action === 'download_file'
                                ? '#b45309'
                                : entry.action === 'delete_account'
                                ? '#b91c1c'
                                : '#334155',
                          }}
                        >
                          {entry.action}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
                        {entry.details || '-'}
                      </td>
                      <td>
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
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
            <div className="empty-state">Loading file audit logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="empty-state">No file transfer logs found matching filter.</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Transfer ID</th>
                    <th>Sender</th>
                    <th>Receiver</th>
                    <th>Delivery Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, idx) => (
                    <tr key={`${log.transfer_id}-${idx}`}>
                      <td className="muted-cell">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="mono-cell">{log.transfer_id.slice(0, 18)}...</td>
                      <td>{log.sender}</td>
                      <td>{log.receiver}</td>
                      <td>
                        <span className={`badge ${log.status === 'pending' ? 'badge-pending' : 'badge-delivered'}`}>
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
