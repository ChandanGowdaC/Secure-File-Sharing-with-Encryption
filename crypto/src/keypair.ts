import { CRYPTO_PARAMS } from './constants'

export interface DhKeyPair {
  publicKey: string
  privateKey: string
}

/** F.1 – Long-term DH key pair generated at registration (client-side only). */
export async function generateLongTermKeyPair(): Promise<DhKeyPair> {
  // TODO: implement with libsodium-wrappers or Web Crypto (X25519)
  void CRYPTO_PARAMS
  throw new Error('generateLongTermKeyPair not implemented')
}

/** F.6 – Fresh ephemeral DH key pair per file transfer. */
export async function generateEphemeralKeyPair(): Promise<DhKeyPair> {
  throw new Error('generateEphemeralKeyPair not implemented')
}
