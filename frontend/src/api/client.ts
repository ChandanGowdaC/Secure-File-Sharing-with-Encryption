const API_BASE = import.meta.env.VITE_API_BASE ?? '/api/v1'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed: ${response.status}`)
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
    register: (body: unknown) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: unknown) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    verifyMfa: (body: unknown) => request('/auth/mfa/verify', { method: 'POST', body: JSON.stringify(body) }),
    lookupPublicKey: (params: { username?: string; email?: string }) => {
      const query = new URLSearchParams()
      if (params.username) query.set('username', params.username)
      if (params.email) query.set('email', params.email)
      return request(`/auth/users/public-key?${query}`)
    },
  },
  transfers: {
    upload: (body: unknown) => request('/transfers/upload', { method: 'POST', body: JSON.stringify(body) }),
    pending: () => request('/transfers/pending'),
    received: () => request('/transfers/received'),
    deliver: (transferId: string) =>
      request(`/transfers/${transferId}/deliver`, { method: 'POST' }),
    downloadAck: (transferId: string, body: unknown) =>
      request(`/transfers/${transferId}/download-ack`, { method: 'POST', body: JSON.stringify(body) }),
  },
  admin: {
    logs: () => request('/admin/logs'),
  },
}
