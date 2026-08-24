/** Set 2 – F.4–F.9 File upload, encryption, and queue. */

export default function UploadPage() {
  return (
    <section>
      <h1>Send Encrypted File</h1>
      <p>Lookup receiver public key, encrypt with ephemeral DH + AES-256-GCM, and queue for delivery.</p>
      {/* TODO: receiver lookup, file picker, encryptFile(), upload API */}
    </section>
  )
}
