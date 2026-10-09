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
  id?: string | number
  username: string
  email: string
  is_admin: boolean
  last_login?: string
  last_login_at?: string
}

export const AdminPage: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [users, setUsers] = useState<UserEntry[]>([])
  const [loadingLogs, setLoadingLogs] = useState<boolean>(true)
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true)
  const [searchUsername, setSearchUsername] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'transfers' | 'users'>('transfers')

  const fetchLogs = async () => {
    setLoadingLogs(true)
    setError(null)
    try {
      const res = await api.admin.logs()
      setLogs(res.entries || [])
    } catch (err: any) {
      setError(err.message || 'Access denied. Admin session required.')
    } finally {
      setLoadingLogs(false)
    }
  }

  const fetchUsers = async () => {
    setLoadingUsers(true)
    setError(null)
    try {
      const res = await api.admin.users()
      setUsers(res.users || [])
    } catch (err: any) {
      setError(err.message || 'Access denied. Admin session required.')
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'transfers') {
      fetchLogs()
    } else {
      fetchUsers()
    }
  }, [activeTab])

  const handleGeneratePdf = async (username: string) => {
    try {
      await api.admin.generatePdf(username)
    } catch (err: any) {
      alert(err.message || 'PDF generation failed')
    }
  }

  const filteredLogs = logs.filter(
    l =>
      !searchUsername ||
      l.sender.toLowerCase().includes(searchUsername.toLowerCase()) ||
      l.receiver.toLowerCase().includes(searchUsername.toLowerCase()) ||
      l.transfer_id.toLowerCase().includes(searchUsername.toLowerCase())
  )

  const filteredUsers = users.filter(
    u => !searchUsername || u.username.toLowerCase().includes(searchUsername.toLowerCase()) || u.email.toLowerCase().includes(searchUsername.toLowerCase())
  )

  return (
    <div className="page-shell">
      <section className="page-hero admin-hero">
        <div>
          <p className="eyebrow" style={{ color: 'var(--primary-accent)' }}>Metadata-only audit trail</p>
          <h1>System Audit & Admin Control</h1>
          <p>
            Monitor user activity and transfer logs without compromising end-to-end encryption.
          </p>
        </div>
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button 
          className={activeTab === 'transfers' ? 'btn-primary' : 'btn-secondary'} 
          onClick={() => setActiveTab('transfers')}
        >
          Transfer Logs
        </button>
        <button 
          className={activeTab === 'users' ? 'btn-primary' : 'btn-secondary'} 
          onClick={() => setActiveTab('users')}
        >
          Users List & Activity
        </button>
      </div>

      <section className="glass-card admin-panel">
        <div className="admin-toolbar">
          <input
            type="text"
            className="form-control"
            placeholder={activeTab === 'transfers' ? 'Filter by sender, receiver, or transfer ID...' : 'Filter by username or email...'}
            value={searchUsername}
            onChange={e => setSearchUsername(e.target.value)}
          />
          <div className="log-count">
            <span>{activeTab === 'transfers' ? filteredLogs.length : filteredUsers.length}</span>
            records
          </div>
        </div>

        {activeTab === 'transfers' && (
          loadingLogs ? (
            <div className="empty-state">
              Loading audit logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="empty-state">
              No audit log records found matching search.
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Transfer ID</th>
                    <th>Sender</th>
                    <th>Receiver</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, idx) => (
                    <tr key={`${log.transfer_id}-${idx}`}>
                      <td className="muted-cell">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="mono-cell">
                        {log.transfer_id.slice(0, 18)}...
                      </td>
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

        {activeTab === 'users' && (
          loadingUsers ? (
            <div className="empty-state">
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state">
              No users found matching search.
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id || user.username}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        {user.is_admin ? <span className="badge badge-admin">Admin</span> : <span className="badge badge-pending">User</span>}
                      </td>
                      <td className="muted-cell">
                        {user.last_login_at || user.last_login ? new Date((user.last_login_at || user.last_login)!).toLocaleString() : 'Never'}
                      </td>
                      <td>
                        <button 
                          className="btn-secondary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          onClick={() => handleGeneratePdf(user.username)}
                        >
                          Generate PDF Report
                        </button>
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
