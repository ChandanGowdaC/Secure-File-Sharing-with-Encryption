import { CRYPTO_PARAMS } from './constants'

/** F.7 / F.12 – Derive AES-256 transfer key from DH shared secret via HKDF. */
export async function deriveTransferKey(
  privateKey: string,
  remotePublicKey: string,
): Promise<string> {
  void CRYPTO_PARAMS
  void privateKey
  void remotePublicKey
  throw new Error('deriveTransferKey not implemented')
}
