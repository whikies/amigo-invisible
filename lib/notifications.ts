import { prisma } from './prisma'
import nodemailer from 'nodemailer'

// Configuración de email (Nodemailer)
// Para producción, configurar con SMTP real (Gmail, SendGrid, etc.)
const emailTransporter = process.env.SMTP_HOST ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
}) : null

interface CreateNotificationParams {
  userId: number
  type: 'sorteo' | 'recordatorio' | 'invitacion' | 'sistema'
  title: string
  message: string
  link?: string
  eventId?: number
  sendEmail?: boolean
}

/**
 * Crea una notificación in-app y opcionalmente envía email
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
  eventId,
  sendEmail = false
}: CreateNotificationParams) {
  try {
    // Crear notificación in-app
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link: link || null,
        eventId: eventId || null
      }
    })

    console.log(`📬 Notificación creada para usuario ${userId}: ${title}`)

    // Enviar email si está habilitado y configurado
    if (sendEmail && emailTransporter) {
      await sendNotificationEmail(userId, title, message, link)
    }

    return notification
  } catch (error) {
    console.error('Error al crear notificación:', error)
    throw error
  }
}

/**
 * Crea notificaciones para múltiples usuarios
 */
export async function createBulkNotifications(
  userIds: number[],
  params: Omit<CreateNotificationParams, 'userId'>
) {
  try {
    const notifications = await prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link || null,
        eventId: params.eventId || null
      }))
    })

    console.log(`📬 ${notifications.count} notificaciones creadas`)

    // Enviar emails si está habilitado
    if (params.sendEmail && emailTransporter) {
      for (const userId of userIds) {
        await sendNotificationEmail(userId, params.title, params.message, params.link)
      }
    }

    return notifications
  } catch (error) {
    console.error('Error al crear notificaciones masivas:', error)
    throw error
  }
}

/**
 * Envía un email de notificación
 */
async function sendNotificationEmail(
  userId: number,
  title: string,
  message: string,
  link?: string
) {
  if (!emailTransporter) {
    console.log('⚠️ Email no configurado (SMTP no disponible)')
    return
  }

  try {
    // Obtener email del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true }
    })

    if (!user) {
      console.error(`Usuario ${userId} no encontrado`)
      return
    }

    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const linkHtml = link ? `<p><a href="${appUrl}${link}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Ver en la aplicación</a></p>` : ''

    await emailTransporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@reyesmagos.com',
      to: user.email,
      subject: `🔔 ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1f2937; border-bottom: 3px solid #3b82f6; padding-bottom: 10px;">
            ⭐ Reyes Magos
          </h1>
          <h2 style="color: #3b82f6;">${title}</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
            Hola ${user.name},
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
            ${message}
          </p>
          ${linkHtml}
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            Este es un mensaje automático del sistema de Amigo Invisible Reyes Magos.
          </p>
        </div>
      `
    })

    console.log(`📧 Email enviado a ${user.email}`)
  } catch (error) {
    console.error('Error al enviar email:', error)
    // No lanzar error, solo loguearlo (el email es opcional)
  }
}

/**
 * Notifica a todos los participantes de un evento que se realizó el sorteo
 */
export async function notifySorteoCompleted(eventId: number) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        participants: {
          include: {
            user: true
          }
        }
      }
    })

    if (!event) {
      throw new Error('Evento no encontrado')
    }

    const userIds = event.participants.map(p => p.userId)

    await createBulkNotifications(userIds, {
      type: 'sorteo',
      title: '🎲 ¡Sorteo Realizado!',
      message: `El sorteo del evento "${event.name}" ha sido realizado. Ya puedes ver tu asignación.`,
      link: '/mi-asignacion',
      eventId: event.id,
      sendEmail: true
    })

    console.log(`✅ Notificaciones de sorteo enviadas para evento ${event.name}`)
  } catch (error) {
    console.error('Error al notificar sorteo:', error)
    throw error
  }
}

/**
 * Notifica recordatorio del evento X días antes
 */
export async function notifyEventReminder(eventId: number, daysUntil: number) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        participants: {
          include: {
            user: true
          }
        }
      }
    })

    if (!event) {
      throw new Error('Evento no encontrado')
    }

    const userIds = event.participants.map(p => p.userId)
    const eventDateStr = event.eventDate
      ? new Date(event.eventDate).toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'fecha por confirmar'

    await createBulkNotifications(userIds, {
      type: 'recordatorio',
      title: `⏰ Recordatorio: ${event.name}`,
      message: `El evento "${event.name}" es en ${daysUntil} día${daysUntil > 1 ? 's' : ''} (${eventDateStr}). ¡No olvides tu regalo!`,
      link: `/mis-eventos`,
      eventId: event.id,
      sendEmail: true
    })

    console.log(`✅ Recordatorios enviados para evento ${event.name} (${daysUntil} días)`)
  } catch (error) {
    console.error('Error al enviar recordatorio:', error)
    throw error
  }
}

/**
 * Notifica cuando un usuario se inscribe a un evento
 */
export async function notifyEventJoined(userId: number, eventId: number) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!event) {
      throw new Error('Evento no encontrado')
    }

    await createNotification({
      userId,
      type: 'invitacion',
      title: '✅ Inscripción Confirmada',
      message: `Te has inscrito exitosamente al evento "${event.name}". Espera el sorteo para conocer tu asignación.`,
      link: '/mis-eventos',
      eventId: event.id,
      sendEmail: false // No enviar email por inscripción (opcional)
    })

    console.log(`✅ Notificación de inscripción enviada para usuario ${userId}`)
  } catch (error) {
    console.error('Error al notificar inscripción:', error)
    // No lanzar error, la inscripción es lo importante
  }
}
