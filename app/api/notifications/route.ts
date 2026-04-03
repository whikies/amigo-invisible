import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// Obtener notificaciones del usuario
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const userId = parseInt(session.user.id)

    // Obtener notificaciones del usuario, ordenadas por fecha
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limitar a las últimas 50 notificaciones
    })

    // Contar notificaciones no leídas
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    })

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount
    })

  } catch (error) {
    console.error('Error al obtener notificaciones:', error)
    return NextResponse.json(
      { error: 'Error interno al obtener notificaciones' },
      { status: 500 }
    )
  }
}

// Crear una notificación (solo admins o sistema)
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Solo admins pueden crear notificaciones manualmente
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para crear notificaciones' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, type, title, message, link, eventId } = body

    // Validaciones
    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Crear notificación
    const notification = await prisma.notification.create({
      data: {
        userId: parseInt(userId),
        type,
        title,
        message,
        link: link || null,
        eventId: eventId ? parseInt(eventId) : null
      }
    })

    console.log(`📬 Notificación creada para usuario ${userId}: ${title}`)

    return NextResponse.json({
      success: true,
      notification
    })

  } catch (error) {
    console.error('Error al crear notificación:', error)
    return NextResponse.json(
      { error: 'Error interno al crear notificación' },
      { status: 500 }
    )
  }
}
