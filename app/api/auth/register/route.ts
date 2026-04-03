import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { email, password, name, invitationCode } = await req.json()

    // VALIDAR CÓDIGO DE INVITACIÓN (OBLIGATORIO)
    if (!invitationCode) {
      return NextResponse.json(
        { error: 'Código de invitación requerido' },
        { status: 400 }
      )
    }

    // Buscar invitación válida
    const invitation = await prisma.invitation.findFirst({
      where: {
        code: invitationCode.toUpperCase(),
        email: email,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Código de invitación inválido, expirado o ya usado' },
        { status: 400 }
      )
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      )
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear usuario y marcar invitación como usada
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'user',
        isActive: true
      }
    })

    // Marcar invitación como usada
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { used: true }
    })

    console.log(`✅ Usuario registrado con invitación: ${email}`)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error) {
    console.error('Error en registro:', error)
    return NextResponse.json(
      { error: 'Error al crear la cuenta' },
      { status: 500 }
    )
  }
}
