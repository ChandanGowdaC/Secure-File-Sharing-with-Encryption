import { useEffect, useState } from 'react'
import { api } from '../api/client'

interface LogEntry {
  transfer_id: string
  sender: string
  receiver: string
  timestamp: string
  status: string
  file_size_bytes?: number | null
}

function formatFileSize(bytes?: number | null) {
  if (bytes === null || bytes === undefined) return 'Unknown'
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
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
    <div className="page-shell">
      <section className="page-hero admin-hero">
        <div>
          <p className="eyebrow">Metadata-only audit trail</p>
          <h1>System Audit & Transfer Logs</h1>
          <p>
            Metadata-only event log tracking transfer lifecycle without storing plaintexts or private keys.
          </p>
        </div>
        <button onClick={fetchLogs} className="btn-secondary">
          Refresh Logs
        </button>
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="glass-card admin-panel">
        <div className="admin-toolbar">
          <input
            type="text"
            className="form-control"
            placeholder="Filter by sender, receiver, or transfer ID..."
            value={searchUsername}
            onChange={e => setSearchUsername(e.target.value)}
          />
          <div className="log-count">
            <span>{filteredLogs.length}</span>
            records
          </div>
        </div>

        {loading ? (
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
                  <th>File Size</th>
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
                    <td>{formatFileSize(log.file_size_bytes)}</td>
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
      </section>
    </div>
  )
}
