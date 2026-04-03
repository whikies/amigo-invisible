/**
 * Utilidades de cifrado usando Web Crypto API (compatible con Edge Runtime)
 * Migración desde Node.js crypto module
 */

/**
 * Genera bytes aleatorios y los convierte a cadena hexadecimal
 * Reemplaza crypto.randomBytes(n).toString('hex')
 */
export function generateRandomHex(bytes: number): string {
  const randomBytes = new Uint8Array(bytes)
  crypto.getRandomValues(randomBytes)

  return Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Convierte un string a ArrayBuffer
 */
function stringToBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str).buffer
}

/**
 * Convierte un ArrayBuffer a string
 */
function bufferToString(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer)
}

/**
 * Convierte un ArrayBuffer a hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Convierte un hex string a ArrayBuffer
 */
function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
  }
  return bytes.buffer
}

/**
 * Deriva una clave de cifrado usando PBKDF2
 * Reemplaza crypto.pbkdf2Sync
 */
async function deriveKey(
  password: string,
  salt: ArrayBuffer,
  iterations: number = 100000
): Promise<CryptoKey> {
  // Importar la contraseña como material de clave
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    stringToBuffer(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  // Derivar la clave usando PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Cifra datos usando AES-256-GCM
 * Reemplaza crypto.createCipheriv('aes-256-gcm', ...)
 */
export async function encryptAES(
  plaintext: string,
  password: string
): Promise<{
  encryptedData: string
  iv: string
  salt: string
}> {
  // Generar salt e IV aleatorios
  const salt = new Uint8Array(32)
  const iv = new Uint8Array(16)
  crypto.getRandomValues(salt)
  crypto.getRandomValues(iv)

  // Derivar clave de la contraseña
  const key = await deriveKey(password, salt.buffer)

  // Cifrar los datos
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    stringToBuffer(plaintext)
  )

  return {
    encryptedData: bufferToHex(encryptedBuffer),
    iv: bufferToHex(iv.buffer),
    salt: bufferToHex(salt.buffer)
  }
}

/**
 * Descifra datos usando AES-256-GCM
 * Reemplaza crypto.createDecipheriv('aes-256-gcm', ...)
 */
export async function decryptAES(
  encryptedData: string,
  iv: string,
  salt: string,
  password: string
): Promise<string> {
  try {
    // Convertir de hex a ArrayBuffer
    const encryptedBuffer = hexToBuffer(encryptedData)
    const ivBuffer = hexToBuffer(iv)
    const saltBuffer = hexToBuffer(salt)

    // Derivar clave de la contraseña
    const key = await deriveKey(password, saltBuffer)

    // Descifrar
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(ivBuffer)
      },
      key,
      encryptedBuffer
    )

    return bufferToString(decryptedBuffer)
  } catch {
    throw new Error('Error al descifrar: contraseña incorrecta o datos corruptos')
  }
}
