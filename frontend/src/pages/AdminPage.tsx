import React, { useEffect, useState } from 'react'
import { api } from '../api/client'

interface LogEntry {
  transfer_id: string
  sender: string
  receiver: string
  timestamp: string
  status: string
}

export default function AdminPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchUsername, setSearchUsername] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    fetchLogs()
  }, [])

  const filteredLogs = logs.filter(
    l =>
      !searchUsername ||
      l.sender.toLowerCase().includes(searchUsername.toLowerCase()) ||
      l.receiver.toLowerCase().includes(searchUsername.toLowerCase()) ||
      l.transfer_id.toLowerCase().includes(searchUsername.toLowerCase())
  )

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto' }} className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>⚙️ System Audit & Transfer Logs</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Metadata-only event log tracking transfer lifecycle without storing plaintexts or private keys.
          </p>
        </div>
        <button onClick={fetchLogs} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
          🔄 Refresh Logs
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          className="form-control"
          placeholder="🔍 Filter by sender, receiver, or transfer ID..."
          value={searchUsername}
          onChange={e => setSearchUsername(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          Loading audit logs...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          📄 No audit log records found matching search.
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
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {log.transfer_id.slice(0, 18)}...
                  </td>
                  <td>👤 {log.sender}</td>
                  <td>👤 {log.receiver}</td>
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
      )}
    </div>
  )
}
