'use server'

import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

import { auth } from '@/auth'
import type { ActionResult } from '@/lib/action-result'
import { prisma } from '@/lib/prisma'
import {
  addParticipantsSchema,
  createExclusionSchema,
  createUserSchema,
  updateUserSchema,
  type AddParticipantsInput,
  type CreateExclusionInput,
  type CreateUserInput,
  type UpdateUserInput,
} from '@/lib/validation/user-management'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    return { error: 'No autorizado' }
  }
  return { session }
}

export async function createUserAction(values: CreateUserInput): Promise<ActionResult> {
  const parsed = createUserSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Revisa los datos del formulario',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const authState = await requireAdmin()
  if ('error' in authState) return { success: false, error: authState.error }

  try {
    const email = parsed.data.email.toLowerCase()
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return { success: false, error: 'El email ya esta registrado' }
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 10)
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        password: hashedPassword,
        role: parsed.data.role,
        isActive: parsed.data.isActive,
      },
    })

    revalidatePath('/usuarios')
    revalidatePath('/admin/usuarios')

    return { success: true, message: 'Usuario creado exitosamente' }
  } catch (error) {
    console.error('Error al crear usuario:', error)
    return { success: false, error: 'Error al crear usuario' }
  }
}

export async function updateUserAction(userId: number, values: UpdateUserInput): Promise<ActionResult> {
  const parsed = updateUserSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Revisa los datos del formulario',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const authState = await requireAdmin()
  if ('error' in authState) return { success: false, error: authState.error }

  if (!Number.isInteger(userId) || userId <= 0) {
    return { success: false, error: 'ID de usuario invalido' }
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return { success: false, error: 'Usuario no encontrado' }

    const updateData: {
      name?: string
      email?: string
      password?: string
      role?: 'admin' | 'user'
      isActive?: boolean
    } = {}

    if (parsed.data.name) updateData.name = parsed.data.name

    if (parsed.data.email) {
      const normalizedEmail = parsed.data.email.toLowerCase()
      if (normalizedEmail !== user.email) {
        const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } })
        if (existingUser) {
          return { success: false, error: 'El email ya esta en uso por otro usuario' }
        }
      }
      updateData.email = normalizedEmail
    }

    if (parsed.data.role) updateData.role = parsed.data.role
    if (typeof parsed.data.isActive === 'boolean') updateData.isActive = parsed.data.isActive

    if (parsed.data.password && parsed.data.password.trim()) {
      updateData.password = await bcrypt.hash(parsed.data.password, 10)
    }

    await prisma.user.update({ where: { id: userId }, data: updateData })

    revalidatePath('/usuarios')
    revalidatePath('/admin/usuarios')

    return { success: true, message: 'Usuario actualizado exitosamente' }
  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    return { success: false, error: 'Error al actualizar usuario' }
  }
}

export async function deleteUserAction(userId: number): Promise<ActionResult> {
  const authState = await requireAdmin()
  if ('error' in authState) return { success: false, error: authState.error }

  if (!Number.isInteger(userId) || userId <= 0) {
    return { success: false, error: 'ID de usuario invalido' }
  }

  if (userId === parseInt(authState.session.user.id)) {
    return { success: false, error: 'No puedes eliminar tu propia cuenta' }
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return { success: false, error: 'Usuario no encontrado' }

    await prisma.user.delete({ where: { id: userId } })

    revalidatePath('/usuarios')
    revalidatePath('/admin/usuarios')

    return { success: true, message: 'Usuario eliminado exitosamente' }
  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    return { success: false, error: 'Error al eliminar usuario' }
  }
}

export async function getImpersonationDataAction(
  targetUserId: number
): Promise<ActionResult<{ userId: string; adminId: string; token: string }>> {
  const authState = await requireAdmin()
  if ('error' in authState) return { success: false, error: authState.error }

  if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
    return { success: false, error: 'ID de usuario invalido' }
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } })
    if (!targetUser) return { success: false, error: 'Usuario no encontrado' }
    if (!targetUser.isActive) return { success: false, error: 'No puedes impersonar a un usuario inactivo' }

    const token = `impersonate_${authState.session.user.id}_${targetUser.id}_${process.env.AUTH_SECRET}`

    return {
      success: true,
      data: {
        userId: targetUser.id.toString(),
        adminId: authState.session.user.id,
        token,
      },
    }
  } catch (error) {
    console.error('Error al generar impersonacion:', error)
    return { success: false, error: 'Error al impersonar usuario' }
  }
}

export async function getAvailableUsersAction(eventId: number): Promise<ActionResult<{ users: Array<{ id: number; name: string; email: string; isActive: boolean }> }>> {
  const authState = await requireAdmin()
  if ('error' in authState) return { success: false, error: authState.error }

  if (!Number.isInteger(eventId) || eventId <= 0) {
    return { success: false, error: 'ID de evento invalido' }
  }

  try {
    const participants = await prisma.eventParticipant.findMany({
      where: { eventId },
      select: { userId: true },
    })

    const participantIds = participants.map((participant) => participant.userId)

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        id: { notIn: participantIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    })

    return {
      success: true,
      data: { users },
    }
  } catch (error) {
    console.error('Error al obtener usuarios disponibles:', error)
    return { success: false, error: 'Error al obtener usuarios' }
  }
}

export async function addParticipantsAction(values: AddParticipantsInput): Promise<ActionResult<{ added: number }>> {
  const parsed = addParticipantsSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Revisa los datos del formulario',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const authState = await requireAdmin()
  if ('error' in authState) return { success: false, error: authState.error }

  try {
    const event = await prisma.event.findUnique({ where: { id: parsed.data.eventId } })
    if (!event) return { success: false, error: 'Evento no encontrado' }

    const participants = await Promise.all(
      parsed.data.userIds.map(async (userId) => {
        try {
          return await prisma.eventParticipant.create({
            data: { eventId: parsed.data.eventId, userId },
          })
        } catch (error: unknown) {
          if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
            return null
          }
          throw error
        }
      })
    )

    const added = participants.filter((participant) => participant !== null).length

    revalidatePath(`/admin/eventos/${parsed.data.eventId}`)
    revalidatePath('/participantes')

    return {
      success: true,
      message: `${added} participante(s) agregado(s)`,
      data: { added },
    }
  } catch (error) {
    console.error('Error al agregar participantes:', error)
    return { success: false, error: 'Error al agregar participantes' }
  }
}

export async function removeParticipantAction(eventId: number, participantId: number): Promise<ActionResult> {
  const authState = await requireAdmin()
  if ('error' in authState) return { success: false, error: authState.error }

  if (!Number.isInteger(eventId) || eventId <= 0 || !Number.isInteger(participantId) || participantId <= 0) {
    return { success: false, error: 'IDs invalidos' }
  }

  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } })
    if (!event) return { success: false, error: 'Evento no encontrado' }

    await prisma.eventParticipant.delete({ where: { id: participantId } })

    revalidatePath(`/admin/eventos/${eventId}`)
    revalidatePath('/participantes')

    return { success: true, message: 'Participante eliminado' }
  } catch (error: unknown) {
    console.error('Error al eliminar participante:', error)
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2025') {
      return { success: false, error: 'Participante no encontrado' }
    }
    return { success: false, error: 'Error al eliminar participante' }
  }
}

export async function createExclusionAction(values: CreateExclusionInput): Promise<ActionResult> {
  const parsed = createExclusionSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Revisa los datos del formulario',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const authState = await requireAdmin()
  if ('error' in authState) return { success: false, error: authState.error }

  try {
    const [user1, user2] = await Promise.all([
      prisma.user.findUnique({ where: { id: parsed.data.userId } }),
      prisma.user.findUnique({ where: { id: parsed.data.excludedUserId } }),
    ])

    if (!user1 || !user2) {
      return { success: false, error: 'Uno o ambos usuarios no existen' }
    }

    const existingExclusion = await prisma.userExclusion.findFirst({
      where: {
        OR: [
          { userId: parsed.data.userId, excludedUserId: parsed.data.excludedUserId },
          { userId: parsed.data.excludedUserId, excludedUserId: parsed.data.userId },
        ],
      },
    })

    if (existingExclusion) {
      return { success: false, error: 'Ya existe una exclusion entre estos usuarios' }
    }

    await Promise.all([
      prisma.userExclusion.create({
        data: {
          userId: parsed.data.userId,
          excludedUserId: parsed.data.excludedUserId,
          reason: parsed.data.reason || null,
        },
      }),
      prisma.userExclusion.create({
        data: {
          userId: parsed.data.excludedUserId,
          excludedUserId: parsed.data.userId,
          reason: parsed.data.reason || null,
        },
      }),
    ])

    revalidatePath('/exclusiones')
    revalidatePath('/admin/exclusiones')

    return { success: true, message: 'Exclusion creada exitosamente' }
  } catch (error) {
    console.error('Error al crear exclusion:', error)
    return { success: false, error: 'Error al crear exclusion' }
  }
}

export async function deleteExclusionAction(exclusionId: number): Promise<ActionResult> {
  const authState = await requireAdmin()
  if ('error' in authState) return { success: false, error: authState.error }

  if (!Number.isInteger(exclusionId) || exclusionId <= 0) {
    return { success: false, error: 'ID de exclusion invalido' }
  }

  try {
    const exclusion = await prisma.userExclusion.findUnique({ where: { id: exclusionId } })
    if (!exclusion) return { success: false, error: 'Exclusion no encontrada' }

    await prisma.userExclusion.deleteMany({
      where: {
        OR: [
          { userId: exclusion.userId, excludedUserId: exclusion.excludedUserId },
          { userId: exclusion.excludedUserId, excludedUserId: exclusion.userId },
        ],
      },
    })

    revalidatePath('/exclusiones')
    revalidatePath('/admin/exclusiones')

    return { success: true, message: 'Exclusion eliminada exitosamente' }
  } catch (error) {
    console.error('Error al eliminar exclusion:', error)
    return { success: false, error: 'Error al eliminar exclusion' }
  }
}
