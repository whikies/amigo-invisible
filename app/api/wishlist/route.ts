import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/wishlist?eventId=X&userId=Y
 * Obtiene la lista de deseos de un usuario en un evento
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const eventId = searchParams.get('eventId')
    const userId = searchParams.get('userId')

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID requerido' },
        { status: 400 }
      )
    }

    // Si no se especifica userId, usar el del usuario autenticado
    const targetUserId = userId ? parseInt(userId) : parseInt(session.user.id)

    const wishList = await prisma.wishList.findMany({
      where: {
        eventId: parseInt(eventId),
        userId: targetUserId
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(wishList)
  } catch (error) {
    console.error('Error en GET /api/wishlist:', error)
    return NextResponse.json(
      { error: 'Error al obtener lista de deseos' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/wishlist
 * Crea un nuevo item en la lista de deseos
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { eventId, item, priority, link } = await request.json()

    if (!eventId || !item) {
      return NextResponse.json(
        { error: 'Event ID e item son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el usuario está participando en el evento
    const participant = await prisma.eventParticipant.findUnique({
      where: {
        eventId_userId: {
          eventId: parseInt(eventId),
          userId: parseInt(session.user.id)
        }
      }
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'No estás participando en este evento' },
        { status: 403 }
      )
    }

    const wishListItem = await prisma.wishList.create({
      data: {
        userId: parseInt(session.user.id),
        eventId: parseInt(eventId),
        item,
        priority: priority || 0,
        link: link || null
      }
    })

    return NextResponse.json(wishListItem, { status: 201 })
  } catch (error) {
    console.error('Error en POST /api/wishlist:', error)
    return NextResponse.json(
      { error: 'Error al crear item' },
      { status: 500 }
    )
  }
}
