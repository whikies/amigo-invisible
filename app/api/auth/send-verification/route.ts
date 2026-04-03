import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateRandomHex } from '@/lib/webCrypto'
import { sendEmail } from '@/lib/email'

/**
 * POST /api/auth/send-verification
 * Envía un email de verificación al usuario autenticado
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si ya está verificado
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'El email ya está verificado' },
        { status: 400 }
      )
    }

    // Eliminar tokens antiguos del usuario
    await prisma.verificationToken.deleteMany({
      where: { userId: user.id }
    })

    // Generar token seguro
    const token = generateRandomHex(32)

    // Crear token en la base de datos (expira en 24 horas)
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
      }
    })

    // Construir URL de verificación
    const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`

    // Enviar email
    await sendEmail({
      to: user.email,
      subject: 'Verifica tu Email - Amigo Invisible',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Verifica tu Email</h2>
          <p>Hola ${user.name},</p>
          <p>Gracias por registrarte. Para completar tu registro y acceder a todas las funcionalidades, verifica tu email haciendo clic en el siguiente enlace:</p>
          <div style="margin: 30px 0;">
            <a href="${verificationUrl}"
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verificar Email
            </a>
          </div>
          <p>Este enlace expirará en 24 horas.</p>
          <p>Si no te registraste en nuestra plataforma, puedes ignorar este email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            Este es un mensaje automático, por favor no respondas a este email.
          </p>
        </div>
      `
    })

    return NextResponse.json({
      success: true,
      message: 'Email de verificación enviado'
    })
  } catch (error) {
    console.error('Error en send-verification:', error)
    return NextResponse.json(
      { error: 'Error al enviar email de verificación' },
      { status: 500 }
    )
  }
}
