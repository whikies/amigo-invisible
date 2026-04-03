import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// Obtener un evento específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const eventId = parseInt(id)

    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            participants: true,
            assignments: true
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      event
    })

  } catch (error) {
    console.error('Error al obtener evento:', error)
    return NextResponse.json(
      { error: 'Error interno al obtener el evento' },
      { status: 500 }
    )
  }
}

// Actualizar un evento
export async function PUT(
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
        { error: 'No tienes permisos para editar eventos' },
        { status: 403 }
      )
    }

    const { id } = await params
    const eventId = parseInt(id)

    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }

    // Verificar que el evento existe
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, description, year, eventDate, drawDate, isActive } = body

    // Validaciones
    if (!name || !year) {
      return NextResponse.json(
        { error: 'Nombre y año son requeridos' },
        { status: 400 }
      )
    }

    const currentYear = new Date().getFullYear()
    if (year < currentYear - 5 || year > currentYear + 10) {
      return NextResponse.json(
        { error: 'El año debe estar entre el año actual -5 y +10 años' },
        { status: 400 }
      )
    }

    // Si el evento ya fue sorteado, no permitir desactivarlo o cambiar participantes
    if (existingEvent.isDrawn && !isActive) {
      return NextResponse.json(
        { error: 'No puedes desactivar un evento que ya ha sido sorteado' },
        { status: 400 }
      )
    }

    // Actualizar evento
    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        name,
        description: description || null,
        year: parseInt(year),
        eventDate: eventDate ? new Date(eventDate) : null,
        drawDate: drawDate ? new Date(drawDate) : null,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    console.log(`✅ Evento actualizado: ${event.name} (ID: ${event.id})`)

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        name: event.name,
        description: event.description,
        year: event.year,
        isActive: event.isActive,
        eventDate: event.eventDate,
        drawDate: event.drawDate
      }
    })

  } catch (error) {
    console.error('Error al actualizar evento:', error)
    return NextResponse.json(
      { error: 'Error interno al actualizar el evento' },
      { status: 500 }
    )
  }
}

// Eliminar un evento
export async function DELETE(
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
        { error: 'No tienes permisos para eliminar eventos' },
        { status: 403 }
      )
    }

    const { id } = await params
    const eventId = parseInt(id)

    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }

    // Verificar que el evento existe
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            participants: true,
            assignments: true
          }
        }
      }
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    // Si el evento ya fue sorteado, no permitir eliminarlo
    if (existingEvent.isDrawn) {
      return NextResponse.json(
        { error: 'No puedes eliminar un evento que ya ha sido sorteado. Considera desactivarlo en su lugar.' },
        { status: 400 }
      )
    }

    // Eliminar evento (CASCADE eliminará participantes y asignaciones)
    await prisma.event.delete({
      where: { id: eventId }
    })

    console.log(`🗑️ Evento eliminado: ${existingEvent.name} (ID: ${eventId})`)

    return NextResponse.json({
      success: true,
      message: 'Evento eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error al eliminar evento:', error)
    return NextResponse.json(
      { error: 'Error interno al eliminar el evento' },
      { status: 500 }
    )
  }
}
