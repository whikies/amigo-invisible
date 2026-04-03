import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
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
        { error: 'No tienes permisos para crear eventos' },
        { status: 403 }
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
    if (year < currentYear || year > currentYear + 10) {
      return NextResponse.json(
        { error: 'El año debe estar entre el año actual y +10 años' },
        { status: 400 }
      )
    }

    // Crear evento
    const event = await prisma.event.create({
      data: {
        name,
        description: description || null,
        year: parseInt(year),
        eventDate: eventDate ? new Date(eventDate) : null,
        drawDate: drawDate ? new Date(drawDate) : null,
        isActive: isActive !== undefined ? isActive : true,
        isDrawn: false
      }
    })

    console.log(`✅ Evento creado: ${event.name} (ID: ${event.id})`)

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        name: event.name,
        description: event.description,
        year: event.year,
        isActive: event.isActive
      }
    })

  } catch (error) {
    console.error('Error al crear evento:', error)
    return NextResponse.json(
      { error: 'Error interno al crear el evento' },
      { status: 500 }
    )
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    // Obtener eventos
    const eventos = await prisma.event.findMany({
      include: {
        _count: {
          select: {
            participants: true,
            assignments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      eventos
    })

  } catch (error) {
    console.error('Error al obtener eventos:', error)
    return NextResponse.json(
      { error: 'Error al obtener eventos' },
      { status: 500 }
    )
  }
}
