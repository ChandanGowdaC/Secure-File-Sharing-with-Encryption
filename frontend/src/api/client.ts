const API_BASE = import.meta.env.VITE_API_BASE ?? '/api/v1'

let authToken: string | null = null

export function setAuthToken(token: string | null) {
  authToken = token
  if (token) {
    localStorage.setItem('sfs_token', token)
  } else {
    localStorage.removeItem('sfs_token')
  }
}

export function getAuthToken(): string | null {
  if (!authToken && typeof localStorage !== 'undefined') {
    authToken = localStorage.getItem('sfs_token')
  }
  return authToken
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail || body.error || `Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const api = {
  health: async () => {
    const response = await fetch('/health')
    if (!response.ok) throw new Error('Health check failed')
    return response.json() as Promise<{ status: string }>
  },
  auth: {
    register: (body: unknown) => request<{ message: string; username: string; mfa_provisioning_uri?: string }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: unknown) => request<{ mfa_required: boolean; mfa_challenge_token?: string; session_token?: string; message: string; is_admin?: boolean; masked_email?: string; username?: string }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    verifyMfa: (body: unknown) => request<{ mfa_required: boolean; session_token?: string; message: string; is_admin?: boolean; username?: string }>('/auth/mfa/verify', { method: 'POST', body: JSON.stringify(body) }),
    deleteAccount: () => request<void>('/auth/me', { method: 'DELETE' }),
    forgotPassword: (body: { email: string }) => request<{ message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }),
    resetPassword: (body: { token: string; new_password: string }) => request<{ message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),
    changePassword: (body: { current_password: string; new_password: string }) => request<{ message: string }>('/auth/change-password', { method: 'POST', body: JSON.stringify(body) }),
    lookupPublicKey: (params: { username?: string; email?: string }) => {
      const query = new URLSearchParams()
      if (params.username) query.set('username', params.username)
      if (params.email) query.set('email', params.email)
      return request<{ found: boolean; username?: string; public_key?: string; message?: string }>(`/auth/users/public-key?${query}`)
    },
  },
  transfers: {
    upload: (body: unknown) => request<{ transfer_id: string; status: string; message: string }>('/transfers/upload', { method: 'POST', body: JSON.stringify(body) }),
    pending: () => request<{ transfers: Array<{ transfer_id: string; sender: string; receiver: string; status: string; file_size_bytes?: number | null }> }>('/transfers/pending'),
    received: () => request<{ transfers: Array<unknown> }>('/transfers/received'),

    deliver: (transferId: string) =>
      request<{ transfer_id: string; ciphertext: string; nonce: string; auth_tag: string; sender_ephemeral_public_key: string; sender: string; original_filename?: string; file_size_bytes?: number | null }>(`/transfers/${transferId}/deliver`, { method: 'POST' }),
    downloadAck: (transferId: string, body: unknown) =>
      request(`/transfers/${transferId}/download-ack`, { method: 'POST', body: JSON.stringify(body) }),
  },
  admin: {
    logs: () => request<{ entries: Array<{ transfer_id: string; sender: string; receiver: string; timestamp: string; status: string }> }>('/admin/logs'),
    activityLogs: (username?: string) => request<{ entries: Array<any> }>('/admin/activity-logs' + (username ? '?username=' + username : '')),
    users: () => request<{ users: Array<any> }>('/admin/users'),
    generatePdf: async (username: string) => { const token = getAuthToken(); const response = await fetch(API_BASE + '/admin/activity-logs/' + username + '/pdf', { headers: { Authorization: 'Bearer ' + token } }); if (!response.ok) throw new Error('PDF generation failed'); const blob = await response.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = username + '_activity_log.pdf'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }
  },
}
