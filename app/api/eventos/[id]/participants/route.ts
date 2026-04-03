import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// Agregar participantes
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id } = await params
    const eventId = parseInt(id)
    const body = await request.json()
    const { userIds } = body

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Debes proporcionar al menos un userId' },
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

    // Verificar si ya están sorteados (advertencia)
    if (evento.isDrawn) {
      console.warn(`⚠️ Agregando participantes a evento ${eventId} que ya tiene sorteo realizado`)
    }

    // Crear participantes (ignorar duplicados)
    const participants = await Promise.all(
      userIds.map(async (userId) => {
        try {
          return await prisma.eventParticipant.create({
            data: {
              eventId,
              userId
            }
          })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          // Ignorar error de duplicado (unique constraint)
          if (error.code === 'P2002') {
            return null
          }
          throw error
        }
      })
    )

    const created = participants.filter(p => p !== null).length

    console.log(`✅ ${created} participantes agregados al evento ${eventId}`)

    return NextResponse.json({
      success: true,
      added: created,
      message: `${created} participante(s) agregado(s)`
    })

  } catch (error) {
    console.error('Error al agregar participantes:', error)
    return NextResponse.json(
      { error: 'Error al agregar participantes' },
      { status: 500 }
    )
  }
}
