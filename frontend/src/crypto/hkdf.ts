import { CRYPTO_PARAMS } from './constants'

function getCrypto(): Crypto {
  const cryptoObj = typeof window !== 'undefined' && window.crypto ? window.crypto : (globalThis.crypto as Crypto)
  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error('Web Crypto API is not available in this environment.')
  }
  return cryptoObj
}

/** F.7 / F.12 – Derive 256-bit AES-GCM transfer key from local ECDH private key & remote ECDH public key via HKDF. */
export async function deriveTransferKey(
  privateKeyJwkStr: string,
  remotePublicKeyJwkStr: string,
): Promise<CryptoKey> {
  const crypto = getCrypto()

  const privateKeyJwk = JSON.parse(privateKeyJwkStr)
  const remotePublicKeyJwk = JSON.parse(remotePublicKeyJwkStr)

  const privateKey = await crypto.subtle.importKey(
    'jwk',
    privateKeyJwk,
    { name: 'ECDH', namedCurve: CRYPTO_PARAMS.namedCurve },
    false,
    ['deriveBits']
  )

  const remotePublicKey = await crypto.subtle.importKey(
    'jwk',
    remotePublicKeyJwk,
    { name: 'ECDH', namedCurve: CRYPTO_PARAMS.namedCurve },
    false,
    []
  )

  // 1. Compute ECDH shared secret (256 bits)
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: remotePublicKey },
    privateKey,
    256
  )

  // 2. Import shared secret as HKDF master key
  const hkdfKey = await crypto.subtle.importKey(
    'raw',
    sharedSecretBits,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  )

  // 3. HKDF derive 256-bit AES-GCM transfer key
  const infoBytes = new TextEncoder().encode(CRYPTO_PARAMS.hkdfInfo)
  const transferKey = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: CRYPTO_PARAMS.hkdfHash,
      salt: new Uint8Array(0),
      info: infoBytes,
    },
    hkdfKey,
    { name: 'AES-GCM', length: CRYPTO_PARAMS.aesKeyLength },
    true,
    ['encrypt', 'decrypt']
  )

  return transferKey
}

