import { NextRequest, NextResponse } from 'next/server'
import speakeasy from 'speakeasy'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { encryptTwoFactorSecret } from '@/lib/two-factor-crypto'

/**
 * POST /api/auth/2fa/enable
 * Habilita 2FA verificando un codigo TOTP.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { secret, token } = await request.json()

    if (!secret || !token) {
      return NextResponse.json(
        { error: 'Secret y token son requeridos' },
        { status: 400 }
      )
    }

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
    })

    if (!verified) {
      return NextResponse.json(
        { error: 'Codigo invalido. Verifica que estes usando el codigo actual de tu aplicacion' },
        { status: 400 }
      )
    }

    const { encrypted, iv, authTag } = await encryptTwoFactorSecret(secret)
    const encryptedSecret = `${encrypted}:${iv}:${authTag}`

    await prisma.user.update({
      where: { id: parseInt(session.user.id) },
      data: {
        twoFactorSecret: encryptedSecret,
        twoFactorEnabled: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: '2FA habilitado exitosamente',
    })
  } catch (error) {
    console.error('Error en 2fa/enable:', error)
    return NextResponse.json({ error: 'Error al habilitar 2FA' }, { status: 500 })
  }
}
