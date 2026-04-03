import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import speakeasy from 'speakeasy'

/**
 * Convierte un ArrayBuffer a hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Cifrar el secret con AES-256-GCM usando Web Crypto API
async function encryptSecret(secret: string): Promise<{ encrypted: string; iv: string; authTag: string }> {
  const encoder = new TextEncoder()

  // Importar la clave desde AUTH_SECRET
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(process.env.AUTH_SECRET || ''),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  // Derivar clave usando PBKDF2 (simulando scrypt)
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
    ['encrypt']
  )

  // Generar IV aleatorio
  const iv = new Uint8Array(16)
  crypto.getRandomValues(iv)

  // Cifrar
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    encoder.encode(secret)
  )

  // Separar encrypted data y authTag (últimos 16 bytes)
  const encryptedArray = new Uint8Array(encryptedBuffer)
  const authTagLength = 16
  const ciphertextLength = encryptedArray.length - authTagLength
  const ciphertext = encryptedArray.slice(0, ciphertextLength)
  const authTag = encryptedArray.slice(ciphertextLength)

  return {
    encrypted: bufferToHex(ciphertext.buffer),
    iv: bufferToHex(iv.buffer),
    authTag: bufferToHex(authTag.buffer)
  }
}

/**
 * POST /api/auth/2fa/enable
 * Habilita 2FA verificando un código TOTP
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { secret, token } = await request.json()

    if (!secret || !token) {
      return NextResponse.json(
        { error: 'Secret y token son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el token es válido
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Permitir 2 ventanas de tiempo (60 segundos)
    })

    if (!verified) {
      return NextResponse.json(
        { error: 'Código inválido. Verifica que estés usando el código actual de tu aplicación' },
        { status: 400 }
      )
    }

    // Cifrar el secret antes de guardarlo
    const { encrypted, iv, authTag } = await encryptSecret(secret)
    const encryptedSecret = `${encrypted}:${iv}:${authTag}`

    // Guardar secret y habilitar 2FA
    await prisma.user.update({
      where: { id: parseInt(session.user.id) },
      data: {
        twoFactorSecret: encryptedSecret,
        twoFactorEnabled: true
      }
    })

    return NextResponse.json({
      success: true,
      message: '2FA habilitado exitosamente'
    })
  } catch (error) {
    console.error('Error en 2fa/enable:', error)
    return NextResponse.json(
      { error: 'Error al habilitar 2FA' },
      { status: 500 }
    )
  }
}
