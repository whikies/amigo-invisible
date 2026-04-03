'use server'

import { auth } from '@/auth'
import type { ActionResult } from '@/lib/action-result'
import { prisma } from '@/lib/prisma'

export interface EventHistoryItem {
  id: number
  name: string
  description: string | null
  year: number
  drawDate: Date | null
  eventDate: Date | null
  isActive: boolean
  isDrawn: boolean
  createdAt: Date
  stats: {
    totalParticipants: number
    hadAssignment: boolean
    isCompleted: boolean
  }
}

export interface ExportResult {
  data: string
  filename: string
}

export async function getEventHistoryAction(): Promise<
  ActionResult<EventHistoryItem[]>
> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No autenticado',
      }
    }

    const userId = parseInt(session.user.id)

    const events = await prisma.event.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
      },
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
        assignments: {
          where: {
            userId,
          },
        },
      },
      orderBy: {
        year: 'desc',
      },
    })

    const eventsWithStats: EventHistoryItem[] = events.map((event) => ({
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
        isCompleted: event.eventDate ? new Date(event.eventDate) < new Date() : false,
      },
    }))

    return {
      success: true,
      data: eventsWithStats,
    }
  } catch (error) {
    console.error('Error al obtener historial de eventos:', error)
    return {
      success: false,
      error: 'Error al obtener historial',
    }
  }
}

export async function exportEventsHistoryAction(
  format: 'csv' | 'json'
): Promise<ActionResult<ExportResult>> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No autenticado',
      }
    }

    const userId = parseInt(session.user.id)

    const events = await prisma.event.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
      },
      include: {
        participants: true,
        assignments: {
          where: {
            userId,
          },
        },
      },
      orderBy: {
        year: 'desc',
      },
    })

    if (format === 'csv') {
      const csvHeaders =
        'ID,Nombre,Año,Fecha Sorteo,Fecha Evento,Participantes,Estado\n'
      const csvRows = events
        .map((event) => {
          return [
            event.id,
            `"${event.name}"`,
            event.year,
            event.drawDate ? new Date(event.drawDate).toLocaleDateString() : '',
            event.eventDate ? new Date(event.eventDate).toLocaleDateString() : '',
            event.participants.length,
            event.isDrawn ? 'Sorteado' : 'Pendiente',
          ].join(',')
        })
        .join('\n')

      const csv = csvHeaders + csvRows

      return {
        success: true,
        data: {
          data: csv,
          filename: `eventos-${Date.now()}.csv`,
        },
      }
    } else if (format === 'json') {
      const jsonData = events.map((e) => ({
        id: e.id,
        name: e.name,
        year: e.year,
        drawDate: e.drawDate,
        eventDate: e.eventDate,
        participants: e.participants.length,
        status: e.isDrawn ? 'Sorteado' : 'Pendiente',
      }))

      return {
        success: true,
        data: {
          data: JSON.stringify(jsonData, null, 2),
          filename: `eventos-${Date.now()}.json`,
        },
      }
    } else {
      return {
        success: false,
        error: 'Formato no soportado',
      }
    }
  } catch (error) {
    console.error('Error al exportar eventos:', error)
    return {
      success: false,
      error: 'Error al exportar datos',
    }
  }
}
