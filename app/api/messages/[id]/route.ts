import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * PATCH /api/messages/[id]
 * Marca un mensaje como leído
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { id } = await params

    const message = await prisma.message.findUnique({
      where: { id: parseInt(id) }
    })

    if (!message) {
      return NextResponse.json(
        { error: 'Mensaje no encontrado' },
        { status: 404 }
      )
    }

    // Solo el receptor puede marcar como leído
    if (message.receiverId !== parseInt(session.user.id)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const updatedMessage = await prisma.message.update({
      where: { id: parseInt(id) },
      data: { isRead: true }
    })

    return NextResponse.json(updatedMessage)
  } catch (error) {
    console.error('Error en PATCH /api/messages/[id]:', error)
    return NextResponse.json(
      { error: 'Error al actualizar mensaje' },
      { status: 500 }
    )
  }
}
