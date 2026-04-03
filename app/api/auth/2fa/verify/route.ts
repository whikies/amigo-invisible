import { NextRequest, NextResponse } from 'next/server'
import speakeasy from 'speakeasy'

import { prisma } from '@/lib/prisma'
import { decryptTwoFactorSecret } from '@/lib/two-factor-crypto'

/**
 * POST /api/auth/2fa/verify
 * Verifica un codigo 2FA para un usuario.
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

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o inactivo' },
        { status: 404 }
      )
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA no habilitado para este usuario' },
        { status: 400 }
      )
    }

    const secret = await decryptTwoFactorSecret(user.twoFactorSecret)

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
    })

    if (!verified) {
      return NextResponse.json(
        { error: 'Codigo invalido o expirado' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Codigo verificado exitosamente',
    })
  } catch (error) {
    console.error('Error en 2fa/verify:', error)
    return NextResponse.json(
      { error: 'Error al verificar codigo 2FA' },
      { status: 500 }
    )
  }
}
