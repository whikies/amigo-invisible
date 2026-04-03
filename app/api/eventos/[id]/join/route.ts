import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { notifyEventJoined } from '@/lib/notifications'

export const runtime = 'nodejs'

// Inscribirse en un evento
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

    // Verificar que el evento existe y está disponible
    const evento = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!evento) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    if (!evento.isActive) {
      return NextResponse.json(
        { error: 'El evento no está activo' },
        { status: 400 }
      )
    }

    if (evento.isDrawn) {
      return NextResponse.json(
        { error: 'No puedes inscribirte, el sorteo ya se realizó' },
        { status: 400 }
      )
    }

    // Verificar si ya está inscrito
    const yaInscrito = await prisma.eventParticipant.findFirst({
      where: {
        eventId,
        userId
      }
    })

    if (yaInscrito) {
      return NextResponse.json(
        { error: 'Ya estás inscrito en este evento' },
        { status: 400 }
      )
    }

    // Inscribir al usuario
    await prisma.eventParticipant.create({
      data: {
        eventId,
        userId
      }
    })

    console.log(`✅ Usuario ${userId} inscrito en evento ${eventId}`)

    // Enviar notificación de inscripción
    try {
      await notifyEventJoined(userId, eventId)
    } catch (notifError) {
      console.error('Error al enviar notificación de inscripción:', notifError)
      // No fallar la inscripción por error en notificación
    }

    return NextResponse.json({
      success: true,
      message: 'Te has inscrito exitosamente'
    })

  } catch (error) {
    console.error('Error al inscribirse:', error)
    return NextResponse.json(
      { error: 'Error al inscribirse en el evento' },
      { status: 500 }
    )
  }
}
