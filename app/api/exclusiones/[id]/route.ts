import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// Eliminar exclusión
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id } = await params
    const exclusionId = parseInt(id)

    if (isNaN(exclusionId)) {
      return NextResponse.json(
        { error: 'ID de exclusión inválido' },
        { status: 400 }
      )
    }

    // Obtener la exclusión
    const exclusion = await prisma.userExclusion.findUnique({
      where: { id: exclusionId }
    })

    if (!exclusion) {
      return NextResponse.json(
        { error: 'Exclusión no encontrada' },
        { status: 404 }
      )
    }

    // Eliminar ambas exclusiones (bidireccional)
    await prisma.userExclusion.deleteMany({
      where: {
        OR: [
          {
            userId: exclusion.userId,
            excludedUserId: exclusion.excludedUserId
          },
          {
            userId: exclusion.excludedUserId,
            excludedUserId: exclusion.userId
          }
        ]
      }
    })

    console.log(`✅ Exclusión eliminada entre usuarios ${exclusion.userId} y ${exclusion.excludedUserId}`)

    return NextResponse.json({
      success: true,
      message: 'Exclusión eliminada exitosamente'
    })

  } catch (error) {
    console.error('Error al eliminar exclusión:', error)
    return NextResponse.json(
      { error: 'Error al eliminar exclusión' },
      { status: 500 }
    )
  }
}
