import { CRYPTO_PARAMS } from './constants'

export interface DhKeyPair {
  publicKey: string   // JSON string of JWK
  privateKey: string  // JSON string of JWK
}

/** Helper to generate ECDH keypair using Web Crypto API */
async function generateEcdhKeyPair(): Promise<DhKeyPair> {
  const cryptoObj = typeof window !== 'undefined' && window.crypto ? window.crypto : (globalThis.crypto as Crypto)
  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error('Web Crypto API is not available in this environment.')
  }

  const keyPair = await cryptoObj.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: CRYPTO_PARAMS.namedCurve,
    },
    true,
    ['deriveKey', 'deriveBits']
  )

  const publicKeyJwk = await cryptoObj.subtle.exportKey('jwk', keyPair.publicKey)
  const privateKeyJwk = await cryptoObj.subtle.exportKey('jwk', keyPair.privateKey)

  return {
    publicKey: JSON.stringify(publicKeyJwk),
    privateKey: JSON.stringify(privateKeyJwk),
  }
}

/** F.1 – Long-term DH key pair generated at registration (client-side only). */
export async function generateLongTermKeyPair(): Promise<DhKeyPair> {
  return generateEcdhKeyPair()
}

/** F.6 – Fresh ephemeral DH key pair per file transfer. */
export async function generateEphemeralKeyPair(): Promise<DhKeyPair> {
  return generateEcdhKeyPair()
}

