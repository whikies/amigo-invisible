import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// Impersonar a un usuario
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
    const targetUserId = parseInt(id)

    if (isNaN(targetUserId)) {
      return NextResponse.json(
        { error: 'ID de usuario inválido' },
        { status: 400 }
      )
    }

    // Verificar que el usuario existe y está activo
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    if (!targetUser.isActive) {
      return NextResponse.json(
        { error: 'No puedes impersonar a un usuario inactivo' },
        { status: 400 }
      )
    }

    console.log(`👨‍💼 Admin ${session.user.email} impersonando a ${targetUser.email}`)

    // Generar token de impersonación
    const token = `impersonate_${session.user.id}_${targetUser.id}_${process.env.AUTH_SECRET}`

    return NextResponse.json({
      success: true,
      impersonateData: {
        userId: targetUser.id.toString(),
        adminId: session.user.id,
        token
      }
    })

  } catch (error) {
    console.error('Error al impersonar usuario:', error)
    return NextResponse.json(
      { error: 'Error al impersonar usuario' },
      { status: 500 }
    )
  }
}
