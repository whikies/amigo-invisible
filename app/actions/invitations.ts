'use server'

import { auth } from '@/auth'
import type { ActionResult } from '@/lib/action-result'
import { sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { generateRandomHex } from '@/lib/webCrypto'
import { invitationSchema, type InvitationInput } from '@/lib/validation/invitation'

export interface SentInvitation {
  id: number
  email: string
  code: string
  used: boolean
  expiresAt: Date
  createdAt: Date
}

export async function getSentInvitationsAction(): Promise<
  ActionResult<SentInvitation[]>
> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No autenticado',
      }
    }

    const invitations = await prisma.invitation.findMany({
      where: {
        senderId: parseInt(session.user.id),
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return {
      success: true,
      data: invitations,
    }
  } catch (error) {
    console.error('Error al obtener invitaciones:', error)
    return {
      success: false,
      error: 'Error al obtener invitaciones',
    }
  }
}

export async function deleteInvitationAction(id: number): Promise<ActionResult> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return { success: false, error: 'No autenticado' }
    }

    const invitation = await prisma.invitation.findUnique({ where: { id } })

    if (!invitation) {
      return { success: false, error: 'Invitacion no encontrada' }
    }

    if (invitation.senderId !== parseInt(session.user.id)) {
      return { success: false, error: 'No autorizado' }
    }

    if (invitation.used) {
      return { success: false, error: 'No se puede eliminar una invitacion ya utilizada' }
    }

    await prisma.invitation.delete({ where: { id } })

    return { success: true, message: 'Invitacion eliminada' }
  } catch (error) {
    console.error('Error al eliminar invitacion:', error)
    return { success: false, error: 'Error al eliminar invitacion' }
  }
}

export async function sendInvitationAction(
  values: InvitationInput
): Promise<ActionResult<number>> {
  const parsed = invitationSchema.safeParse(values)

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

    const email = parsed.data.email.toLowerCase()

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return {
        success: false,
        error: 'Este email ya esta registrado en el sistema',
      }
    }

    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    if (existingInvitation) {
      return {
        success: false,
        error: 'Ya existe una invitacion valida para este email',
      }
    }

    const code = generateRandomHex(4).toUpperCase()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invitation = await prisma.invitation.create({
      data: {
        email,
        code,
        senderId: parseInt(session.user.id),
        expiresAt,
      },
    })

    const appUrl = process.env.NEXTAUTH_URL

    try {
      await sendEmail({
        to: email,
        subject: 'Invitacion a Amigo Invisible',
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
                  <h1>Has sido invitado</h1>
                </div>
                <div class="content">
                  <p>Hola,</p>
                  <p><strong>${session.user.name}</strong> te ha invitado a unirte a nuestra plataforma de Amigo Invisible.</p>

                  <p>Para registrarte, usa el siguiente codigo de invitacion:</p>

                  <div class="code-box">
                    <div class="code">${code}</div>
                  </div>

                  <p style="text-align: center;">
                    <a href="${appUrl}/register?code=${code}&email=${encodeURIComponent(email)}" class="button">
                      Registrarme Ahora
                    </a>
                  </p>

                  <p style="color: #666; font-size: 14px;">
                    <strong>Nota:</strong> Esta invitacion es valida por 7 dias y solo puede usarse una vez.
                  </p>

                  <div class="footer">
                    <p>Si no solicitaste esta invitacion, puedes ignorar este correo.</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
      })
    } catch (emailError) {
      console.error('Error al enviar email:', emailError)
    }

    return {
      success: true,
      message: `Invitacion enviada a ${email}`,
      data: invitation.id,
    }
  } catch (error) {
    console.error('Error al crear invitacion:', error)
    return {
      success: false,
      error: 'Error al crear invitacion',
    }
  }
}
