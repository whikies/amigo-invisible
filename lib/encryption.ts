/**
 * Utilidades de cifrado para las asignaciones del amigo invisible
 *
 * Las asignaciones se cifran usando AES-256-GCM con una clave derivada
 * de la contraseña del usuario mediante PBKDF2.
 *
 * Esto garantiza que:
 * - Solo el usuario con su contraseña puede descifrar su asignación
 * - Ni siquiera el administrador puede ver las asignaciones en la BD
 * - Cada asignación tiene su propio salt y IV para máxima seguridad
 */

const IV_LENGTH = 16 // 128 bits
const SALT_LENGTH = 32
const ITERATIONS = 100000 // Iteraciones PBKDF2
const AUTH_TAG_LENGTH = 16 // 128 bits para GCM

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
 * Deriva una clave de cifrado a partir de la contraseña del usuario
 */
async function deriveKey(password: string, salt: ArrayBuffer): Promise<CryptoKey> {
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
      iterations: ITERATIONS,
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
 * Cifra el ID del usuario asignado
 *
 * @param assignedUserId - ID del usuario asignado (a quien se le regala)
 * @param userPassword - Contraseña en texto plano del usuario que regala
 * @returns Objeto con datos cifrados (encryptedData, iv, salt, authTag)
 */
export async function encryptAssignment(
  assignedUserId: number,
  userPassword: string
): Promise<{
  encryptedData: string
  iv: string
  salt: string
  authTag: string
}> {
  // Generar salt e IV aleatorios
  const salt = new Uint8Array(SALT_LENGTH)
  const iv = new Uint8Array(IV_LENGTH)
  crypto.getRandomValues(salt)
  crypto.getRandomValues(iv)

  // Derivar clave de la contraseña
  const key = await deriveKey(userPassword, salt.buffer)

  // Cifrar el ID (convertido a string)
  const plaintext = assignedUserId.toString()
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    stringToBuffer(plaintext)
  )

  // En AES-GCM, el authTag está incluido en los últimos 16 bytes del resultado
  const encryptedArray = new Uint8Array(encryptedBuffer)
  const ciphertextLength = encryptedArray.length - AUTH_TAG_LENGTH
  const ciphertext = encryptedArray.slice(0, ciphertextLength)
  const authTag = encryptedArray.slice(ciphertextLength)

  return {
    encryptedData: bufferToHex(ciphertext.buffer),
    iv: bufferToHex(iv.buffer),
    salt: bufferToHex(salt.buffer),
    authTag: bufferToHex(authTag.buffer)
  }
}

/**
 * Descifra el ID del usuario asignado
 *
 * @param encryptedData - Datos cifrados (hex)
 * @param iv - Vector de inicialización (hex)
 * @param salt - Salt usado para derivar la clave (hex)
 * @param authTag - Tag de autenticación GCM (hex)
 * @param userPassword - Contraseña en texto plano del usuario
 * @returns ID del usuario asignado
 * @throws Error si la contraseña es incorrecta o los datos están corruptos
 */
export async function decryptAssignment(
  encryptedData: string,
  iv: string,
  salt: string,
  authTag: string,
  userPassword: string
): Promise<number> {
  try {
    // Convertir de hex a ArrayBuffer
    const ciphertext = new Uint8Array(hexToBuffer(encryptedData))
    const authTagArray = new Uint8Array(hexToBuffer(authTag))
    const ivArray = new Uint8Array(hexToBuffer(iv))
    const saltBuffer = hexToBuffer(salt)

    // En Web Crypto API, el authTag debe estar concatenado con el ciphertext
    const encryptedBuffer = new Uint8Array(ciphertext.length + authTagArray.length)
    encryptedBuffer.set(ciphertext, 0)
    encryptedBuffer.set(authTagArray, ciphertext.length)

    // Derivar clave de la contraseña
    const key = await deriveKey(userPassword, saltBuffer)

    // Descifrar
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivArray
      },
      key,
      encryptedBuffer
    )

    const decrypted = bufferToString(decryptedBuffer)
    return parseInt(decrypted, 10)
  } catch {
    throw new Error('No se pudo descifrar la asignación. Contraseña incorrecta o datos corruptos.')
  }
}

/**
 * Verifica si una contraseña puede descifrar una asignación
 * sin revelar el contenido
 */
export async function canDecryptAssignment(
  encryptedData: string,
  iv: string,
  salt: string,
  authTag: string,
  userPassword: string
): Promise<boolean> {
  try {
    await decryptAssignment(encryptedData, iv, salt, authTag, userPassword)
    return true
  } catch {
    return false
  }
}
