import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

/**
 * POST /api/auth/2fa/setup
 * Genera un secret temporal y QR code para configurar 2FA
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

    // Generar secret
    const secret = speakeasy.generateSecret({
      name: `Amigo Invisible (${session.user.email})`,
      issuer: 'Amigo Invisible'
    })

    // Generar QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url || '')

    return NextResponse.json({
      secret: secret.base32,
      qrCode
    })
  } catch (error) {
    console.error('Error en 2fa/setup:', error)
    return NextResponse.json(
      { error: 'Error al configurar 2FA' },
      { status: 500 }
    )
  }
}
