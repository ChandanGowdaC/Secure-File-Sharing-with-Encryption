/** Secure local storage for long-term private keys (never sent to server). */

const DB_NAME = 'SecureFileSharingKeysDB'
const STORE_NAME = 'private_keys'
const KEY_ALIAS = 'user_long_term_private_key'

/** Opens IndexedDB database for private key storage */
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'))
      return
    }
    const request = window.indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** Stores private key in IndexedDB and localStorage with redundant aliases */
export async function storePrivateKey(username: string, privateKeyJwkStr: string): Promise<void> {
  const trimmed = (username || '').trim()
  const lower = trimmed.toLowerCase()

  // 1. Store in IndexedDB under multiple accessible keys
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      if (trimmed) {
        store.put(privateKeyJwkStr, `${KEY_ALIAS}_${trimmed}`)
        store.put(privateKeyJwkStr, `${KEY_ALIAS}_${lower}`)
      }
      store.put(privateKeyJwkStr, `${KEY_ALIAS}_active`)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.warn('IndexedDB write warning:', err)
  }

  // 2. Redundant backup in localStorage (prevents data loss if IndexedDB is reset or inaccessible)
  if (typeof localStorage !== 'undefined') {
    if (trimmed) {
      localStorage.setItem(`${KEY_ALIAS}_${trimmed}`, privateKeyJwkStr)
      localStorage.setItem(`${KEY_ALIAS}_${lower}`, privateKeyJwkStr)
    }
    localStorage.setItem(`${KEY_ALIAS}_active`, privateKeyJwkStr)
    localStorage.setItem('sfs_current_private_key', privateKeyJwkStr)
  }
}

/** Retrieves private key for user, searching IndexedDB and localStorage with intelligent fallback */
export async function getStoredPrivateKey(username?: string): Promise<string | null> {
  const candidates: string[] = []
  if (username && username.trim()) {
    const trimmed = username.trim()
    candidates.push(`${KEY_ALIAS}_${trimmed}`)
    candidates.push(`${KEY_ALIAS}_${trimmed.toLowerCase()}`)
    if (trimmed.includes('@')) {
      const handle = trimmed.split('@')[0]
      candidates.push(`${KEY_ALIAS}_${handle}`)
      candidates.push(`${KEY_ALIAS}_${handle.toLowerCase()}`)
    }
  }
  candidates.push(`${KEY_ALIAS}_active`)
  candidates.push('sfs_current_private_key')

  // 1. Probe IndexedDB for any candidate alias
  try {
    const db = await openDb()

    for (const key of candidates) {
      const val = await new Promise<string | null>((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readonly')
          const store = tx.objectStore(STORE_NAME)
          const req = store.get(key)
          req.onsuccess = () => resolve(req.result || null)
          req.onerror = () => resolve(null)
        } catch {
          resolve(null)
        }
      })
      if (val) {
        // Sync to localStorage for fast lookup
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('sfs_current_private_key', val)
        }
        return val
      }
    }

    // 2. If candidates did not match, inspect all keys in the store
    const fallbackKey = await new Promise<string | null>((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const req = store.getAllKeys()
        req.onsuccess = () => {
          const allKeys = (req.result || []) as string[]
          const relevant = allKeys.filter(k => typeof k === 'string' && k.startsWith(KEY_ALIAS))

          if (relevant.length === 0) {
            resolve(null)
            return
          }

          // If a username was specified, check if any key matches case-insensitively
          if (username && username.trim()) {
            const needle = username.trim().toLowerCase()
            const match = relevant.find(k => k.toLowerCase().includes(needle))
            if (match) {
              const fetchReq = store.get(match)
              fetchReq.onsuccess = () => resolve(fetchReq.result || null)
              fetchReq.onerror = () => resolve(null)
              return
            }
          }

          // Otherwise return the most recently added or first available user key
          const targetKey = relevant[relevant.length - 1]
          const targetReq = store.get(targetKey)
          targetReq.onsuccess = () => resolve(targetReq.result || null)
          targetReq.onerror = () => resolve(null)
        }
        req.onerror = () => resolve(null)
      } catch {
        resolve(null)
      }
    })

    if (fallbackKey) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('sfs_current_private_key', fallbackKey)
      }
      return fallbackKey
    }
  } catch (err) {
    console.warn('IndexedDB read warning:', err)
  }

  // 3. Fallback to localStorage
  if (typeof localStorage !== 'undefined') {
    for (const key of candidates) {
      const val = localStorage.getItem(key)
      if (val) return val
    }
    // Search any key in localStorage starting with KEY_ALIAS
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(KEY_ALIAS)) {
        const v = localStorage.getItem(k)
        if (v) return v
      }
    }
  }

  return null
}

/** Clears stored private key for user across IndexedDB and localStorage */
export async function clearStoredPrivateKey(username: string): Promise<void> {
  const trimmed = (username || '').trim()
  const lower = trimmed.toLowerCase()

  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      if (trimmed) {
        store.delete(`${KEY_ALIAS}_${trimmed}`)
        store.delete(`${KEY_ALIAS}_${lower}`)
      }
      store.delete(`${KEY_ALIAS}_active`)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // fallback
  }

  if (typeof localStorage !== 'undefined') {
    if (trimmed) {
      localStorage.removeItem(`${KEY_ALIAS}_${trimmed}`)
      localStorage.removeItem(`${KEY_ALIAS}_${lower}`)
    }
    localStorage.removeItem(`${KEY_ALIAS}_active`)
    localStorage.removeItem('sfs_current_private_key')
  }
}
