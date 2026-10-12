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

/** Stores private key in IndexedDB (fallback to localStorage if IndexedDB fails) */
export async function storePrivateKey(username: string, privateKeyJwkStr: string): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.put(privateKeyJwkStr, `${KEY_ALIAS}_${username}`)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`${KEY_ALIAS}_${username}`, privateKeyJwkStr)
    }
  }
}

/** Retrieves private key for user */
export async function getStoredPrivateKey(username: string): Promise<string | null> {
  try {
    const db = await openDb()
    const result = await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(`${KEY_ALIAS}_${username}`)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => reject(req.error)
    })
    if (result) return result
  } catch {
    // fallback check
  }
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(`${KEY_ALIAS}_${username}`)
  }
  return null
}

/** Clears stored private key for user */
export async function clearStoredPrivateKey(username: string): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.delete(`${KEY_ALIAS}_${username}`)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch {
    // fallback
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(`${KEY_ALIAS}_${username}`)
  }
}
