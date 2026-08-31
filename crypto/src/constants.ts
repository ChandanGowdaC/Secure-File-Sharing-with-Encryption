/** Agreed cryptographic parameters – kept in sync across client senders and receivers. */
export const CRYPTO_PARAMS = {
  namedCurve: 'P-256' as const,
  hkdfHash: 'SHA-256' as const,
  hkdfInfo: 'secure-file-sharing-v1',
  aesKeyLength: 256,
  gcmIvLength: 12, // 96-bit nonce as required for AES-GCM
  authTagLength: 16, // 128-bit authentication tag
} as const

