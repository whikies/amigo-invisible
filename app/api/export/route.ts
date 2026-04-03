import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/export/events?format=csv|pdf
 * Exporta el historial de eventos del usuario
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
    const format = searchParams.get('format') || 'csv'

    // Obtener eventos del usuario
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
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        year: 'desc'
      }
    })

    if (format === 'csv') {
      // Generar CSV
      const csvHeaders = 'ID,Nombre,Año,Fecha Sorteo,Fecha Evento,Participantes,Estado\n'
      const csvRows = events.map(event => {
        return [
          event.id,
          `"${event.name}"`,
          event.year,
          event.drawDate ? new Date(event.drawDate).toLocaleDateString() : '',
          event.eventDate ? new Date(event.eventDate).toLocaleDateString() : '',
          event.participants.length,
          event.isDrawn ? 'Sorteado' : 'Pendiente'
        ].join(',')
      }).join('\n')

      const csv = csvHeaders + csvRows

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="eventos-${Date.now()}.csv"`
        }
      })
    } else if (format === 'json') {
      // Exportar como JSON
      return new NextResponse(JSON.stringify(events, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="eventos-${Date.now()}.json"`
        }
      })
    } else {
      return NextResponse.json(
        { error: 'Formato no soportado. Use csv o json' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error en GET /api/export/events:', error)
    return NextResponse.json(
      { error: 'Error al exportar datos' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/export/wishlist?eventId=X&format=csv|pdf
 * Exporta la lista de deseos de un evento
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

    const { eventId, format } = await request.json()

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID requerido' },
        { status: 400 }
      )
    }

    // Obtener wishlist del evento
    const wishList = await prisma.wishList.findMany({
      where: {
        eventId: parseInt(eventId),
        userId: parseInt(session.user.id)
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    if (format === 'csv' || !format) {
      const csvHeaders = 'Item,Prioridad,Link,Comprado,Fecha Creación\n'
      const csvRows = wishList.map(item => {
        const priorityText = item.priority === 2 ? 'Alta' : item.priority === 1 ? 'Media' : 'Baja'
        return [
          `"${item.item}"`,
          priorityText,
          item.link || '',
          item.isPurchased ? 'Sí' : 'No',
          new Date(item.createdAt).toLocaleDateString()
        ].join(',')
      }).join('\n')

      const csv = csvHeaders + csvRows

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="lista-deseos-${Date.now()}.csv"`
        }
      })
    } else {
      return NextResponse.json(
        { error: 'Formato no soportado' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error en POST /api/export:', error)
    return NextResponse.json(
      { error: 'Error al exportar datos' },
      { status: 500 }
    )
  }
}
