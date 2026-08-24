/** Secure local storage for long-term private keys (never sent to server). */

const KEYSTORE_PREFIX = 'sfs-private-key:'

export async function storePrivateKey(username: string, privateKey: string): Promise<void> {
  // TODO: prefer IndexedDB with optional encryption-at-rest wrapper
  localStorage.setItem(`${KEYSTORE_PREFIX}${username}`, privateKey)
}

export async function getStoredPrivateKey(username: string): Promise<string | null> {
  return localStorage.getItem(`${KEYSTORE_PREFIX}${username}`)
}

export async function clearStoredPrivateKey(username: string): Promise<void> {
  localStorage.removeItem(`${KEYSTORE_PREFIX}${username}`)
}
