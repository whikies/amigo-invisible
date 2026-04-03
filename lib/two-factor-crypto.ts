/**
 * Funciones de criptografía para 2FA
 * Usa Web Crypto API para ser compatible con browser y servidor
 */

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
  }
  return bytes.buffer
}

async function deriveKey() {
  const encoder = new TextEncoder()

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(process.env.AUTH_SECRET || ''),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  const salt = encoder.encode('salt')
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  )

  return key
}

export async function encryptTwoFactorSecret(
  secret: string
): Promise<{ encrypted: string; iv: string; authTag: string }> {
  const encoder = new TextEncoder()
  const key = await deriveKey()

  const iv = new Uint8Array(16)
  crypto.getRandomValues(iv)

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encoder.encode(secret)
  )

  const encryptedArray = new Uint8Array(encryptedBuffer)
  const authTagLength = 16
  const ciphertextLength = encryptedArray.length - authTagLength

  const ciphertext = encryptedArray.slice(0, ciphertextLength)
  const authTag = encryptedArray.slice(ciphertextLength)

  return {
    encrypted: bufferToHex(ciphertext.buffer),
    iv: bufferToHex(iv.buffer),
    authTag: bufferToHex(authTag.buffer),
  }
}

export async function decryptTwoFactorSecret(encryptedSecret: string): Promise<string> {
  const [encryptedHex, ivHex, authTagHex] = encryptedSecret.split(':')

  const encrypted = new Uint8Array(hexToBuffer(encryptedHex))
  const iv = new Uint8Array(hexToBuffer(ivHex))
  const authTag = new Uint8Array(hexToBuffer(authTagHex))

  const key = await deriveKey()

  // Combinar ciphertext + authTag para decrypt
  const combined = new Uint8Array(encrypted.length + authTag.length)
  combined.set(encrypted)
  combined.set(authTag, encrypted.length)

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    combined
  )

  return new TextDecoder().decode(decryptedBuffer)
}
