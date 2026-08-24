/** Agreed parameters – keep in sync across sender and receiver. */
export const CRYPTO_PARAMS = {
  curve: 'X25519' as const,
  hkdfInfo: 'secure-file-sharing-v1',
  aesKeyLength: 256,
  gcmIvLength: 12,
} as const
