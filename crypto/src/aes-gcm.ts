/** F.8 / F.13 – AES-256-GCM encrypt and decrypt with authentication tag verification. */

export interface EncryptedPayload {
  ciphertext: string
  nonce: string
  authTag: string
}

export async function encryptFile(
  file: ArrayBuffer,
  transferKey: string,
): Promise<EncryptedPayload> {
  void file
  void transferKey
  throw new Error('encryptFile not implemented')
}

export async function decryptFile(
  payload: EncryptedPayload,
  transferKey: string,
): Promise<ArrayBuffer> {
  void payload
  void transferKey
  throw new Error('decryptFile not implemented')
}
