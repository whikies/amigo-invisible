import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// Crear nueva exclusión
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, excludedUserId, reason } = body

    if (!userId || !excludedUserId) {
      return NextResponse.json(
        { error: 'userId y excludedUserId son requeridos' },
        { status: 400 }
      )
    }

    if (userId === excludedUserId) {
      return NextResponse.json(
        { error: 'No puedes crear una exclusión de un usuario consigo mismo' },
        { status: 400 }
      )
    }

    // Verificar que ambos usuarios existen
    const [user1, user2] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.user.findUnique({ where: { id: excludedUserId } })
    ])

    if (!user1 || !user2) {
      return NextResponse.json(
        { error: 'Uno o ambos usuarios no existen' },
        { status: 404 }
      )
    }

    // Verificar si ya existe la exclusión
    const existingExclusion = await prisma.userExclusion.findFirst({
      where: {
        OR: [
          { userId, excludedUserId },
          { userId: excludedUserId, excludedUserId: userId }
        ]
      }
    })

    if (existingExclusion) {
      return NextResponse.json(
        { error: 'Ya existe una exclusión entre estos usuarios' },
        { status: 400 }
      )
    }

    // Crear exclusión bidireccional
    await Promise.all([
      prisma.userExclusion.create({
        data: {
          userId,
          excludedUserId,
          reason: reason || null
        }
      }),
      prisma.userExclusion.create({
        data: {
          userId: excludedUserId,
          excludedUserId: userId,
          reason: reason || null
        }
      })
    ])

    console.log(`✅ Exclusión creada entre usuarios ${userId} y ${excludedUserId}`)

    return NextResponse.json({
      success: true,
      message: 'Exclusión creada exitosamente'
    })

  } catch (error) {
    console.error('Error al crear exclusión:', error)
    return NextResponse.json(
      { error: 'Error al crear exclusión' },
      { status: 500 }
    )
  }
}
