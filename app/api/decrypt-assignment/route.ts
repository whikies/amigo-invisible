import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { decryptAssignment } from '@/lib/encryption'
import bcrypt from 'bcryptjs'

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

    const userId = parseInt(session.user.id)
    const body = await request.json()
    const { password, encryptedData } = body

    if (!password || !encryptedData) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Obtener datos del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 403 }
      )
    }

    // Descifrar asignación usando el hash de bcrypt como clave
    const decryptedUserId = await decryptAssignment(
      encryptedData.encrypted,
      encryptedData.iv,
      encryptedData.salt,
      encryptedData.authTag,
      user.password  // Usamos el hash bcrypt como "contraseña base"
    )

    // Obtener información del usuario asignado
    const assignedUser = await prisma.user.findUnique({
      where: { id: parseInt(`${decryptedUserId}`) },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    if (!assignedUser) {
      return NextResponse.json(
        { error: 'Usuario asignado no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: assignedUser
    })

  } catch (error) {
    console.error('Error al descifrar asignación:', error)
    return NextResponse.json(
      { error: 'Error al descifrar. Verifica tu contraseña.' },
      { status: 500 }
    )
  }
}
