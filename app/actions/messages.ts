'use server'

import { auth } from '@/auth'
import type { ActionResult } from '@/lib/action-result'
import { prisma } from '@/lib/prisma'
import {
  getChatParticipantsSchema,
  getMessagesSchema,
  markMessageReadSchema,
  sendMessageSchema,
  type GetChatParticipantsInput,
  type GetMessagesInput,
  type MarkMessageReadInput,
  type SendMessageInput,
} from '@/lib/validation/message'

interface ReceivedMessage {
  id: number
  content: string
  isAnonymous: boolean
  isRead: boolean
  createdAt: Date
  sender: {
    id: number
    name: string
  }
}

interface ChatParticipant {
  id: number
  name: string
  email: string
}

export async function getMessagesAction(
  values: GetMessagesInput
): Promise<ActionResult<ReceivedMessage[]>> {
  const parsed = getMessagesSchema.safeParse(values)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Datos invalidos',
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

    const receiverId = parseInt(session.user.id)
    const { eventId } = parsed.data

    const messages = await prisma.message.findMany({
      where: {
        eventId,
        receiverId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const processedMessages = messages.map((msg) => ({
      ...msg,
      sender: msg.isAnonymous ? { id: 0, name: 'Anonimo' } : msg.sender,
    }))

    return {
      success: true,
      data: processedMessages,
    }
  } catch (error) {
    console.error('Error al obtener mensajes:', error)
    return {
      success: false,
      error: 'Error al obtener mensajes',
    }
  }
}

export async function getChatParticipantsAction(
  values: GetChatParticipantsInput
): Promise<ActionResult<ChatParticipant[]>> {
  const parsed = getChatParticipantsSchema.safeParse(values)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Datos invalidos',
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

    const currentUserId = parseInt(session.user.id)
    const { eventId } = parsed.data

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!event) {
      return {
        success: false,
        error: 'Evento no encontrado',
      }
    }

    const participants = event.participants
      .map((participant) => participant.user)
      .filter((user) => user.id !== currentUserId)

    return {
      success: true,
      data: participants,
    }
  } catch (error) {
    console.error('Error al obtener participantes del chat:', error)
    return {
      success: false,
      error: 'Error al cargar participantes',
    }
  }
}

export async function sendMessageAction(
  values: SendMessageInput
): Promise<ActionResult<number>> {
  const parsed = sendMessageSchema.safeParse(values)

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

    const senderId = parseInt(session.user.id)
    const { eventId, receiverId, content, isAnonymous } = parsed.data

    const participants = await prisma.eventParticipant.findMany({
      where: {
        eventId,
        userId: {
          in: [senderId, receiverId],
        },
      },
    })

    if (participants.length !== 2) {
      return {
        success: false,
        error: 'Usuario no valido para este evento',
      }
    }

    const message = await prisma.message.create({
      data: {
        eventId,
        senderId,
        receiverId,
        content,
        isAnonymous: isAnonymous !== false,
      },
    })

    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'sistema',
        title: 'Nuevo mensaje',
        message: isAnonymous
          ? 'Tienes un mensaje anonimo nuevo'
          : `${session.user.name} te ha enviado un mensaje`,
        link: `/eventos/${eventId}/mensajes`,
      },
    })

    return {
      success: true,
      message: 'Mensaje enviado',
      data: message.id,
    }
  } catch (error) {
    console.error('Error al enviar mensaje:', error)
    return {
      success: false,
      error: 'Error al enviar mensaje',
    }
  }
}

export async function markMessageAsReadAction(
  values: MarkMessageReadInput
): Promise<ActionResult> {
  const parsed = markMessageReadSchema.safeParse(values)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Datos invalidos',
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

    const receiverId = parseInt(session.user.id)
    const { messageId } = parsed.data

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    })

    if (!message) {
      return {
        success: false,
        error: 'Mensaje no encontrado',
      }
    }

    if (message.receiverId !== receiverId) {
      return {
        success: false,
        error: 'No autorizado',
      }
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    })

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error al marcar mensaje como leido:', error)
    return {
      success: false,
      error: 'Error al actualizar mensaje',
    }
  }
}
