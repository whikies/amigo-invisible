import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateRandomHex } from '@/lib/webCrypto'
import { sendEmail } from '@/lib/email'

/**
 * POST /api/auth/forgot-password
 * Solicita un token de recuperación de contraseña
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'El email es requerido' },
        { status: 400 }
      )
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    // Por seguridad, siempre devolvemos éxito aunque el email no exista
    // Esto previene enumerar usuarios válidos
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Si el email existe, recibirás un enlace de recuperación'
      })
    }

    // Verificar que el usuario esté activo
    if (!user.isActive) {
      return NextResponse.json({
        success: true,
        message: 'Si el email existe, recibirás un enlace de recuperación'
      })
    }

    // Eliminar tokens antiguos del usuario
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id }
    })

    // Generar token seguro
    const token = generateRandomHex(32)

    // Crear token en la base de datos (expira en 1 hora)
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hora
      }
    })

    // Construir URL de reset
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`

    // Enviar email
    await sendEmail({
      to: user.email,
      subject: 'Recuperación de Contraseña - Amigo Invisible',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Recuperación de Contraseña</h2>
          <p>Hola ${user.name},</p>
          <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}"
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Restablecer Contraseña
            </a>
          </div>
          <p>Este enlace expirará en 1 hora por seguridad.</p>
          <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            Este es un mensaje automático, por favor no respondas a este email.
          </p>
        </div>
      `
    })

    return NextResponse.json({
      success: true,
      message: 'Si el email existe, recibirás un enlace de recuperación'
    })
  } catch (error) {
    console.error('Error en forgot-password:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
