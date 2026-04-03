import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/messages?eventId=X
 * Obtiene los mensajes del usuario en un evento
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID requerido' },
        { status: 400 }
      )
    }

    // Obtener mensajes recibidos
    const messages = await prisma.message.findMany({
      where: {
        eventId: parseInt(eventId),
        receiverId: parseInt(session.user.id)
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Ocultar el nombre del sender si el mensaje es anónimo
    const processedMessages = messages.map(msg => ({
      ...msg,
      sender: msg.isAnonymous ? { id: 0, name: 'Anónimo' } : msg.sender
    }))

    return NextResponse.json(processedMessages)
  } catch (error) {
    console.error('Error en GET /api/messages:', error)
    return NextResponse.json(
      { error: 'Error al obtener mensajes' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/messages
 * Envía un mensaje a otro usuario
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

    const { eventId, receiverId, content, isAnonymous } = await request.json()

    if (!eventId || !receiverId || !content) {
      return NextResponse.json(
        { error: 'Campos requeridos: eventId, receiverId, content' },
        { status: 400 }
      )
    }

    // Verificar que ambos usuarios están participando en el evento
    const participants = await prisma.eventParticipant.findMany({
      where: {
        eventId: parseInt(eventId),
        userId: {
          in: [parseInt(session.user.id), parseInt(receiverId)]
        }
      }
    })

    if (participants.length !== 2) {
      return NextResponse.json(
        { error: 'Usuario no válido para este evento' },
        { status: 403 }
      )
    }

    const message = await prisma.message.create({
      data: {
        eventId: parseInt(eventId),
        senderId: parseInt(session.user.id),
        receiverId: parseInt(receiverId),
        content,
        isAnonymous: isAnonymous !== false // Por defecto true
      }
    })

    // Crear notificación para el receptor
    await prisma.notification.create({
      data: {
        userId: parseInt(receiverId),
        type: 'sistema',
        title: 'Nuevo mensaje',
        message: isAnonymous
          ? 'Tienes un mensaje anónimo nuevo'
          : `${session.user.name} te ha enviado un mensaje`,
        link: `/eventos/${eventId}/mensajes`
      }
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error en POST /api/messages:', error)
    return NextResponse.json(
      { error: 'Error al enviar mensaje' },
      { status: 500 }
    )
  }
}
