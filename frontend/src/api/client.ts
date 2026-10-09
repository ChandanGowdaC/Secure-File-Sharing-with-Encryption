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
    if (response.status === 401 && token) {
      // Clear invalid or expired session token
      setAuthToken(null)
      localStorage.removeItem('sfs_username')
      localStorage.removeItem('sfs_is_admin')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sfs_auth_expired'))
      }
    }
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
    // Try multiple possible paths to accommodate direct port 8000, vite proxy, and production vercel/api
    const baseWithoutPrefix = API_BASE.replace(/\/api\/v1\/?$/, '')
    const candidateUrls = [
      `${API_BASE}/health`,
      `${baseWithoutPrefix}/health`,
      '/health',
      '/api/v1/health'
    ]

    for (const url of candidateUrls) {
      try {
        const response = await fetch(url, { headers: { Accept: 'application/json' } })
        if (response.ok) {
          const contentType = response.headers.get('content-type') || ''
          if (contentType.includes('application/json')) {
            const data = await response.json()
            if (data && data.status === 'ok') {
              return data as { status: string }
            }
          }
        }
      } catch {
        // Try next candidate
      }
    }
    throw new Error('Health check failed')
  },
  auth: {
    register: (body: unknown) =>
      request<{ message: string; username: string; mfa_provisioning_uri?: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    login: (body: unknown) =>
      request<{
        mfa_required: boolean
        mfa_challenge_token?: string
        session_token?: string
        message: string
        is_admin?: boolean
        masked_email?: string
        username?: string
        last_login_at?: string | null
      }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    verifyMfa: (body: unknown) =>
      request<{
        mfa_required: boolean
        session_token?: string
        message: string
        is_admin?: boolean
        username?: string
        last_login_at?: string | null
      }>('/auth/mfa/verify', { method: 'POST', body: JSON.stringify(body) }),
    me: () =>
      request<{
        username: string
        email: string
        is_admin: boolean
        last_login_at?: string | null
        created_at: string
      }>('/auth/me'),
    deleteAccount: () => request<void>('/auth/me', { method: 'DELETE' }),
    forgotPassword: (body: { email: string }) =>
      request<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    resetPassword: (body: { token: string; new_password: string }) =>
      request<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    changePassword: (body: { current_password: string; new_password: string }) =>
      request<{ message: string }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    lookupPublicKey: (params: { username?: string; email?: string }) => {
      const query = new URLSearchParams()
      if (params.username) query.set('username', params.username)
      if (params.email) query.set('email', params.email)
      return request<{ found: boolean; username?: string; public_key?: string; message?: string }>(
        `/auth/users/public-key?${query}`
      )
    },
  },
  transfers: {
    upload: (body: unknown) =>
      request<{ transfer_id: string; status: string; message: string }>('/transfers/upload', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    pending: () =>
      request<{
        transfers: Array<{
          transfer_id: string
          sender: string
          receiver: string
          status: string
          file_size_bytes?: number | null
        }>
      }>('/transfers/pending'),
    received: () => request<{ transfers: Array<unknown> }>('/transfers/received'),
    deliver: (transferId: string) =>
      request<{
        transfer_id: string
        ciphertext: string
        nonce: string
        auth_tag: string
        sender_ephemeral_public_key: string
        sender: string
        original_filename?: string
        file_size_bytes?: number | null
      }>(`/transfers/${transferId}/deliver`, { method: 'POST' }),
    downloadAck: (transferId: string, body: unknown) =>
      request(`/transfers/${transferId}/download-ack`, { method: 'POST', body: JSON.stringify(body) }),
  },
  admin: {
    logs: () =>
      request<{
        entries: Array<{
          transfer_id: string
          sender: string
          receiver: string
          timestamp: string
          status: string
        }>
      }>('/admin/logs'),
    activityLogs: (username?: string) =>
      request<{
        entries: Array<{
          id: number
          username: string
          action: string
          details?: string | null
          ip_address?: string | null
          timestamp: string
        }>
      }>(`/admin/activity-logs${username ? '?username=' + encodeURIComponent(username) : ''}`),
    users: () =>
      request<{
        users: Array<{
          username: string
          email: string
          is_admin: boolean
          last_login_at?: string | null
          created_at: string
        }>
      }>('/admin/users'),
    generatePdf: async (username: string) => {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE}/admin/activity-logs/${encodeURIComponent(username)}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.detail || body.error || `PDF generation failed (${response.status})`)
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `activity_log_${username}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
  },
}
