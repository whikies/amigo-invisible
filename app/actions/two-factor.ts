'use server'

import bcrypt from 'bcryptjs'
import QRCode from 'qrcode'
import speakeasy from 'speakeasy'

import { auth } from '@/auth'
import type { ActionResult } from '@/lib/action-result'
import { prisma } from '@/lib/prisma'
import {
  disableTwoFactorSchema,
  enableTwoFactorSchema,
  type DisableTwoFactorInput,
  type EnableTwoFactorInput,
} from '@/lib/validation/two-factor'

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function encryptSecret(secret: string): Promise<{ encrypted: string; iv: string; authTag: string }> {
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
    ['encrypt']
  )

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

export async function setupTwoFactorAction(): Promise<ActionResult<{ secret: string; qrCode: string }>> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No autenticado',
      }
    }

    const secret = speakeasy.generateSecret({
      name: `Amigo Invisible (${session.user.email})`,
      issuer: 'Amigo Invisible',
    })

    const qrCode = await QRCode.toDataURL(secret.otpauth_url || '')

    return {
      success: true,
      data: {
        secret: secret.base32,
        qrCode,
      },
    }
  } catch (error) {
    console.error('Error en setup 2FA:', error)
    return {
      success: false,
      error: 'Error al configurar 2FA',
    }
  }
}

export async function enableTwoFactorAction(
  values: EnableTwoFactorInput
): Promise<ActionResult> {
  const parsed = enableTwoFactorSchema.safeParse(values)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Revisa los datos del formulario',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const session = await auth()

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No autenticado',
      }
    }

    const verified = speakeasy.totp.verify({
      secret: parsed.data.secret,
      encoding: 'base32',
      token: parsed.data.token,
      window: 2,
    })

    if (!verified) {
      return {
        success: false,
        error: 'Codigo invalido. Verifica que estes usando el codigo actual de tu aplicacion',
      }
    }

    const { encrypted, iv, authTag } = await encryptSecret(parsed.data.secret)
    const encryptedSecret = `${encrypted}:${iv}:${authTag}`

    await prisma.user.update({
      where: { id: parseInt(session.user.id) },
      data: {
        twoFactorSecret: encryptedSecret,
        twoFactorEnabled: true,
      },
    })

    return {
      success: true,
      message: '2FA habilitado exitosamente',
    }
  } catch (error) {
    console.error('Error en enable 2FA:', error)
    return {
      success: false,
      error: 'Error al habilitar 2FA',
    }
  }
}

export async function disableTwoFactorAction(
  values: DisableTwoFactorInput
): Promise<ActionResult> {
  const parsed = disableTwoFactorSchema.safeParse(values)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Revisa los datos del formulario',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const session = await auth()

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No autenticado',
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
    })

    if (!user) {
      return {
        success: false,
        error: 'Usuario no encontrado',
      }
    }

    const isPasswordValid = await bcrypt.compare(parsed.data.password, user.password)

    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Contrasena incorrecta',
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: null,
        twoFactorEnabled: false,
      },
    })

    return {
      success: true,
      message: '2FA deshabilitado exitosamente',
    }
  } catch (error) {
    console.error('Error en disable 2FA:', error)
    return {
      success: false,
      error: 'Error al deshabilitar 2FA',
    }
  }
}
