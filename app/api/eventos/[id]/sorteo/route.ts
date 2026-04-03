import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { performDraw } from '@/lib/sorteo'
import { prisma } from '@/lib/prisma'
import { notifySorteoCompleted } from '@/lib/notifications'

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar que sea administrador
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar sorteos' },
        { status: 403 }
      )
    }

    const { id } = await params
    const eventId = parseInt(id)

    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: 'ID de evento inválido' },
        { status: 400 }
      )
    }

    // Verificar que el evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { participants: true }
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el evento esté activo
    if (!event.isActive) {
      return NextResponse.json(
        { error: 'El evento no está activo' },
        { status: 400 }
      )
    }

    // Advertir si ya hay un sorteo previo
    if (event.isDrawn) {
      console.warn(`⚠️ Realizando nuevo sorteo para evento ${eventId} que ya tenía uno previo`)
    }

    // Realizar el sorteo
    console.log(`🎲 Iniciando sorteo para evento ${eventId} con ${event._count.participants} participantes`)
    const result = await performDraw(eventId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    console.log(`✅ Sorteo completado: ${result.assignments} asignaciones creadas`)

    // Enviar notificaciones a todos los participantes
    try {
      await notifySorteoCompleted(eventId)
      console.log(`📬 Notificaciones enviadas a participantes`)
    } catch (notifError) {
      console.error('Error al enviar notificaciones (sorteo completado):', notifError)
      // No fallar el sorteo por error en notificaciones
    }

    return NextResponse.json({
      success: true,
      message: 'Sorteo realizado exitosamente',
      assignments: result.assignments
    })

  } catch (error) {
    console.error('Error al realizar sorteo:', error)
    return NextResponse.json(
      { error: 'Error interno al realizar el sorteo' },
      { status: 500 }
    )
  }
}
