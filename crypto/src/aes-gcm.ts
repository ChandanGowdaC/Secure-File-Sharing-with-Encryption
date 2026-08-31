import { CRYPTO_PARAMS } from './constants'

export interface EncryptedPayload {
  ciphertext: string // Base64 encoded
  nonce: string      // Base64 encoded (12 bytes)
  authTag: string    // Base64 encoded (16 bytes)
}

function getCrypto(): Crypto {
  const cryptoObj = typeof window !== 'undefined' && window.crypto ? window.crypto : (globalThis.crypto as Crypto)
  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error('Web Crypto API is not available in this environment.')
  }
  return cryptoObj
}

// Helpers for Base64 encoding/decoding ArrayBuffers
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/** F.8 – Encrypt file with AES-256-GCM producing ciphertext, nonce, and auth tag. */
export async function encryptFile(
  fileBuffer: ArrayBuffer,
  transferKey: CryptoKey,
): Promise<EncryptedPayload> {
  const crypto = getCrypto()

  const iv = new Uint8Array(CRYPTO_PARAMS.gcmIvLength)
  crypto.getRandomValues(iv)

  // Web Crypto AES-GCM appends 16-byte tag to ciphertext
  const encryptedResult = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: CRYPTO_PARAMS.authTagLength * 8, // in bits (128 bits)
    },
    transferKey,
    fileBuffer
  )

  const resultBytes = new Uint8Array(encryptedResult)
  const tagLength = CRYPTO_PARAMS.authTagLength
  const ciphertextBytes = resultBytes.slice(0, resultBytes.length - tagLength)
  const authTagBytes = resultBytes.slice(resultBytes.length - tagLength)

  return {
    ciphertext: arrayBufferToBase64(ciphertextBytes.buffer),
    nonce: arrayBufferToBase64(iv.buffer),
    authTag: arrayBufferToBase64(authTagBytes.buffer),
  }
}

/** F.13 – Decrypt file with AES-256-GCM, verifying authentication tag. Throws on mismatch. */
export async function decryptFile(
  payload: EncryptedPayload,
  transferKey: CryptoKey,
): Promise<ArrayBuffer> {
  const crypto = getCrypto()

  const ciphertextBuffer = base64ToArrayBuffer(payload.ciphertext)
  const nonceBuffer = base64ToArrayBuffer(payload.nonce)
  const authTagBuffer = base64ToArrayBuffer(payload.authTag)

  const ciphertextBytes = new Uint8Array(ciphertextBuffer)
  const authTagBytes = new Uint8Array(authTagBuffer)

  // Re-combine ciphertext + tag for Web Crypto decrypt
  const combined = new Uint8Array(ciphertextBytes.length + authTagBytes.length)
  combined.set(ciphertextBytes, 0)
  combined.set(authTagBytes, ciphertextBytes.length)

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(nonceBuffer),
        tagLength: CRYPTO_PARAMS.authTagLength * 8,
      },
      transferKey,
      combined.buffer
    )
    return decrypted
  } catch (err) {
    void err
    throw new Error('Authentication tag verification failed: corrupted payload or invalid transfer key.')
  }
}

