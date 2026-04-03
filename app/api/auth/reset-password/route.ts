import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * POST /api/auth/reset-password
 * Restablece la contraseña usando un token válido
 */
export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Buscar token válido
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 }
      )
    }

    // Verificar que no haya sido usado
    if (resetToken.used) {
      return NextResponse.json(
        { error: 'Este token ya fue utilizado' },
        { status: 400 }
      )
    }

    // Verificar que no haya expirado
    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { error: 'El token ha expirado. Solicita uno nuevo' },
        { status: 400 }
      )
    }

    // Verificar que el usuario esté activo
    if (!resetToken.user.isActive) {
      return NextResponse.json(
        { error: 'Usuario inactivo' },
        { status: 403 }
      )
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Actualizar contraseña y marcar token como usado
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      })
    ])

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    })
  } catch (error) {
    console.error('Error en reset-password:', error)
    return NextResponse.json(
      { error: 'Error al restablecer la contraseña' },
      { status: 500 }
    )
  }
}
