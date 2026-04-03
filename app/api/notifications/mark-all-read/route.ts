import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// Marcar todas las notificaciones como leídas
export async function POST() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const userId = parseInt(session.user.id)

    // Marcar todas como leídas
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: { isRead: true }
    })

    return NextResponse.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    })

  } catch (error) {
    console.error('Error al marcar todas las notificaciones:', error)
    return NextResponse.json(
      { error: 'Error interno al actualizar notificaciones' },
      { status: 500 }
    )
  }
}
