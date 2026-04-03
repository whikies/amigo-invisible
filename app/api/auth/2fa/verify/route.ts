import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import speakeasy from 'speakeasy'

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

// Descifrar el secret usando Web Crypto API
async function decryptSecret(encryptedData: string): Promise<string> {
  const [encrypted, ivHex, authTagHex] = encryptedData.split(':')
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  // Importar la clave desde AUTH_SECRET
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(process.env.AUTH_SECRET || ''),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  // Derivar clave usando PBKDF2
  const salt = encoder.encode('salt')
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['decrypt']
  )

  // Convertir hex a buffers
  const ciphertext = new Uint8Array(hexToBuffer(encrypted))
  const authTag = new Uint8Array(hexToBuffer(authTagHex))
  const iv = new Uint8Array(hexToBuffer(ivHex))

  // Concatenar ciphertext y authTag (Web Crypto API espera esto)
  const encryptedBuffer = new Uint8Array(ciphertext.length + authTag.length)
  encryptedBuffer.set(ciphertext, 0)
  encryptedBuffer.set(authTag, ciphertext.length)

  // Descifrar
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    encryptedBuffer
  )

  return decoder.decode(decryptedBuffer)
}

/**
 * POST /api/auth/2fa/verify
 * Verifica un código 2FA para un usuario
 */
export async function POST(request: NextRequest) {
  try {
    const { email, token } = await request.json()

    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email y token son requeridos' },
        { status: 400 }
      )
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o inactivo' },
        { status: 404 }
      )
    }

    // Verificar que tenga 2FA habilitado
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA no habilitado para este usuario' },
        { status: 400 }
      )
    }

    // Descifrar el secret
    const secret = await decryptSecret(user.twoFactorSecret)

    // Verificar el token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Permitir 2 ventanas de tiempo (60 segundos)
    })

    if (!verified) {
      return NextResponse.json(
        { error: 'Código inválido o expirado' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Código verificado exitosamente'
    })
  } catch (error) {
    console.error('Error en 2fa/verify:', error)
    return NextResponse.json(
      { error: 'Error al verificar código 2FA' },
      { status: 500 }
    )
  }
}
