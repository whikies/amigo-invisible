import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// Obtener usuarios disponibles (que no están en el evento)
export async function GET(
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

    // Obtener IDs de usuarios que ya participan
    const participants = await prisma.eventParticipant.findMany({
      where: { eventId },
      select: { userId: true }
    })

    const participantIds = participants.map(p => p.userId)

    // Obtener usuarios activos que no participan
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        id: { notIn: participantIds }
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ success: true, users })

  } catch (error) {
    console.error('Error al obtener usuarios disponibles:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    )
  }
}
