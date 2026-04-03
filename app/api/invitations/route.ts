import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { generateRandomHex } from '@/lib/webCrypto'

// GET - Obtener invitaciones enviadas
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const invitations = await prisma.invitation.findMany({
      where: {
        senderId: parseInt(session.user.id)
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error('Error al obtener invitaciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener invitaciones' },
      { status: 500 }
    )
  }
}

// POST - Enviar nueva invitación
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Verificar que el email no esté ya registrado
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email ya está registrado en el sistema' },
        { status: 400 }
      )
    }

    // Verificar si ya hay una invitación válida pendiente para este email
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      }
    })

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Ya existe una invitación válida para este email' },
        { status: 400 }
      )
    }

    // Generar código único de 8 caracteres alfanuméricos
    const code = generateRandomHex(4).toUpperCase()

    // Crear invitación (válida por 7 días)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invitation = await prisma.invitation.create({
      data: {
        email,
        code,
        senderId: parseInt(session.user.id),
        expiresAt
      }
    })

    // Enviar email con el código
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    try {
      await sendEmail({
        to: email,
        subject: '🎁 Invitación a Amigo Invisible',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .code-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
                .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
                .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
                .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎁 ¡Has sido invitado!</h1>
                </div>
                <div class="content">
                  <p>Hola,</p>
                  <p><strong>${session.user.name}</strong> te ha invitado a unirte a nuestra plataforma de Amigo Invisible.</p>

                  <p>Para registrarte, usa el siguiente código de invitación:</p>

                  <div class="code-box">
                    <div class="code">${code}</div>
                  </div>

                  <p style="text-align: center;">
                    <a href="${appUrl}/register?code=${code}&email=${encodeURIComponent(email)}" class="button">
                      Registrarme Ahora
                    </a>
                  </p>

                  <p style="color: #666; font-size: 14px;">
                    <strong>Nota:</strong> Esta invitación es válida por 7 días y solo puede usarse una vez.
                  </p>

                  <div class="footer">
                    <p>Si no solicitaste esta invitación, puedes ignorar este correo.</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `
      })
    } catch (emailError) {
      console.error('Error al enviar email:', emailError)
      // No fallar si el email no se puede enviar
    }

    console.log(`✅ Invitación creada: ${email} - Código: ${code}`)

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        code: invitation.code,
        expiresAt: invitation.expiresAt
      }
    })
  } catch (error) {
    console.error('Error al crear invitación:', error)
    return NextResponse.json(
      { error: 'Error al crear invitación' },
      { status: 500 }
    )
  }
}
