import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// Salirse de un evento
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const eventId = parseInt(id)
    const userId = parseInt(session.user.id)

    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: 'ID de evento inválido' },
        { status: 400 }
      )
    }

    // Verificar que el evento existe
    const evento = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!evento) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    if (evento.isDrawn) {
      return NextResponse.json(
        { error: 'No puedes salirte, el sorteo ya se realizó' },
        { status: 400 }
      )
    }

    // Verificar si está inscrito
    const participacion = await prisma.eventParticipant.findFirst({
      where: {
        eventId,
        userId
      }
    })

    if (!participacion) {
      return NextResponse.json(
        { error: 'No estás inscrito en este evento' },
        { status: 400 }
      )
    }

    // Eliminar participación
    await prisma.eventParticipant.delete({
      where: {
        id: participacion.id
      }
    })

    console.log(`✅ Usuario ${userId} eliminado del evento ${eventId}`)

    return NextResponse.json({
      success: true,
      message: 'Te has salido del evento'
    })

  } catch (error) {
    console.error('Error al salirse:', error)
    return NextResponse.json(
      { error: 'Error al salirse del evento' },
      { status: 500 }
    )
  }
}
