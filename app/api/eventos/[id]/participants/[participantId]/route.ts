import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// Eliminar participante
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id, participantId } = await params
    const eventId = parseInt(id)
    const participantIdInt = parseInt(participantId)

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

    // Advertir si ya hay sorteo
    if (evento.isDrawn) {
      console.warn(`⚠️ Eliminando participante de evento ${eventId} que ya tiene sorteo realizado`)
    }

    // Eliminar participante
    await prisma.eventParticipant.delete({
      where: { id: participantIdInt }
    })

    console.log(`✅ Participante ${participantIdInt} eliminado del evento ${eventId}`)

    return NextResponse.json({
      success: true,
      message: 'Participante eliminado'
    })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error al eliminar participante:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Participante no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Error al eliminar participante' },
      { status: 500 }
    )
  }
}
