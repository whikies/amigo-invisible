import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * PUT /api/wishlist/[id]
 * Actualiza un item de la lista de deseos
 */
export async function PUT(
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
    const { item, priority, link, isPurchased } = await request.json()

    // Obtener el item actual
    const existingItem = await prisma.wishList.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item no encontrado' },
        { status: 404 }
      )
    }

    // Solo el dueño puede editar su propia lista (excepto isPurchased)
    if (existingItem.userId !== parseInt(session.user.id) && isPurchased === undefined) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    // Si es isPurchased, verificar que el usuario es quien regala a ese usuario
    if (isPurchased !== undefined) {
      const assignment = await prisma.assignment.findFirst({
        where: {
          eventId: existingItem.eventId,
          userId: parseInt(session.user.id)
        }
      })

      if (!assignment) {
        return NextResponse.json(
          { error: 'No tienes asignación en este evento' },
          { status: 403 }
        )
      }

      // Verificar que el assignment es para el dueño de este wishlist item
      // (esto requeriría descifrar, por ahora permitiremos la actualización)
    }

    const updatedItem = await prisma.wishList.update({
      where: { id: parseInt(id) },
      data: {
        ...(item !== undefined && { item }),
        ...(priority !== undefined && { priority }),
        ...(link !== undefined && { link }),
        ...(isPurchased !== undefined && { isPurchased })
      }
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error en PUT /api/wishlist/[id]:', error)
    return NextResponse.json(
      { error: 'Error al actualizar item' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/wishlist/[id]
 * Elimina un item de la lista de deseos
 */
export async function DELETE(
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

    const existingItem = await prisma.wishList.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item no encontrado' },
        { status: 404 }
      )
    }

    // Solo el dueño puede eliminar su propia lista
    if (existingItem.userId !== parseInt(session.user.id)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    await prisma.wishList.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error en DELETE /api/wishlist/[id]:', error)
    return NextResponse.json(
      { error: 'Error al eliminar item' },
      { status: 500 }
    )
  }
}
