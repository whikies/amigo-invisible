import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/events/history
 * Obtiene el historial de eventos pasados con estadísticas
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener eventos donde el usuario participó
    const events = await prisma.event.findMany({
      where: {
        participants: {
          some: {
            userId: parseInt(session.user.id)
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        assignments: {
          where: {
            userId: parseInt(session.user.id)
          }
        }
      },
      orderBy: {
        year: 'desc'
      }
    })

    // Procesar cada evento para agregar estadísticas
    const eventsWithStats = events.map(event => ({
      id: event.id,
      name: event.name,
      description: event.description,
      year: event.year,
      drawDate: event.drawDate,
      eventDate: event.eventDate,
      isActive: event.isActive,
      isDrawn: event.isDrawn,
      createdAt: event.createdAt,
      stats: {
        totalParticipants: event.participants.length,
        hadAssignment: event.assignments.length > 0,
        isCompleted: event.eventDate ? new Date(event.eventDate) < new Date() : false
      }
    }))

    return NextResponse.json(eventsWithStats)
  } catch (error) {
    console.error('Error en GET /api/events/history:', error)
    return NextResponse.json(
      { error: 'Error al obtener historial' },
      { status: 500 }
    )
  }
}
