'use server'

import { revalidatePath } from 'next/cache'

import { auth } from '@/auth'
import type { ActionResult } from '@/lib/action-result'
import { notifyEventJoined, notifySorteoCompleted } from '@/lib/notifications'
import { prisma } from '@/lib/prisma'
import { performDraw } from '@/lib/sorteo'
import { decryptAssignment } from '@/lib/encryption'
import bcrypt from 'bcryptjs'

export async function joinEventAction(eventId: number): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'No autorizado' }
    }

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return { success: false, error: 'ID de evento invalido' }
    }

    const userId = parseInt(session.user.id)

    const evento = await prisma.event.findUnique({ where: { id: eventId } })

    if (!evento) {
      return { success: false, error: 'Evento no encontrado' }
    }

    if (!evento.isActive) {
      return { success: false, error: 'El evento no esta activo' }
    }

    if (evento.isDrawn) {
      return { success: false, error: 'No puedes inscribirte, el sorteo ya se realizo' }
    }

    const existingParticipant = await prisma.eventParticipant.findFirst({
      where: { eventId, userId },
    })

    if (existingParticipant) {
      return { success: false, error: 'Ya estas inscrito en este evento' }
    }

    await prisma.eventParticipant.create({
      data: { eventId, userId },
    })

    try {
      await notifyEventJoined(userId, eventId)
    } catch (notificationError) {
      console.error('Error al enviar notificacion de inscripcion:', notificationError)
    }

    revalidatePath('/mis-eventos')
    revalidatePath('/eventos')
    revalidatePath(`/admin/eventos/${eventId}`)

    return {
      success: true,
      message: 'Te has inscrito exitosamente',
    }
  } catch (error) {
    console.error('Error al inscribirse en evento:', error)
    return {
      success: false,
      error: 'Error al inscribirse en el evento',
    }
  }
}

export async function leaveEventAction(eventId: number): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'No autorizado' }
    }

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return { success: false, error: 'ID de evento invalido' }
    }

    const userId = parseInt(session.user.id)

    const evento = await prisma.event.findUnique({ where: { id: eventId } })

    if (!evento) {
      return { success: false, error: 'Evento no encontrado' }
    }

    if (evento.isDrawn) {
      return { success: false, error: 'No puedes salirte, el sorteo ya se realizo' }
    }

    const participacion = await prisma.eventParticipant.findFirst({
      where: { eventId, userId },
    })

    if (!participacion) {
      return { success: false, error: 'No estas inscrito en este evento' }
    }

    await prisma.eventParticipant.delete({
      where: { id: participacion.id },
    })

    revalidatePath('/mis-eventos')
    revalidatePath('/eventos')
    revalidatePath(`/admin/eventos/${eventId}`)

    return {
      success: true,
      message: 'Te has salido del evento',
    }
  } catch (error) {
    console.error('Error al salir de evento:', error)
    return {
      success: false,
      error: 'Error al salirse del evento',
    }
  }
}

export async function runEventDrawAction(eventId: number): Promise<ActionResult<{ assignments: number }>> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'No autenticado' }
    }

    if (session.user.role !== 'admin') {
      return { success: false, error: 'No tienes permisos para realizar sorteos' }
    }

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return { success: false, error: 'ID de evento invalido' }
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { participants: true },
        },
      },
    })

    if (!event) {
      return { success: false, error: 'Evento no encontrado' }
    }

    if (!event.isActive) {
      return { success: false, error: 'El evento no esta activo' }
    }

    const drawResult = await performDraw(eventId)

    if (!drawResult.success) {
      return { success: false, error: drawResult.error }
    }

    try {
      await notifySorteoCompleted(eventId)
    } catch (notificationError) {
      console.error('Error al enviar notificaciones de sorteo:', notificationError)
    }

    revalidatePath('/admin/eventos')
    revalidatePath(`/admin/eventos/${eventId}`)
    revalidatePath('/eventos')
    revalidatePath('/mis-eventos')
    revalidatePath('/mi-asignacion')

    return {
      success: true,
      message: 'Sorteo realizado exitosamente',
      data: {
        assignments: drawResult.assignments ?? 0,
      },
    }
  } catch (error) {
    console.error('Error al realizar sorteo:', error)
    return {
      success: false,
      error: 'Error interno al realizar el sorteo',
    }
  }
}

export async function decryptAssignmentAction(
  password: string,
  encryptedData: {
    encrypted: string
    iv: string
    salt: string
    authTag: string
  }
): Promise<
  ActionResult<{
    user: {
      id: number
      name: string
      email: string
    }
  }>
> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'No autenticado' }
    }

    if (!password || !encryptedData) {
      return { success: false, error: 'Faltan datos requeridos' }
    }

    const userId = parseInt(session.user.id)

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return { success: false, error: 'Usuario no encontrado' }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return { success: false, error: 'Contraseña incorrecta' }
    }

    const decryptedUserId = await decryptAssignment(
      encryptedData.encrypted,
      encryptedData.iv,
      encryptedData.salt,
      encryptedData.authTag,
      user.password
    )

    const assignedUser = await prisma.user.findUnique({
      where: { id: parseInt(`${decryptedUserId}`) },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    if (!assignedUser) {
      return { success: false, error: 'Usuario asignado no encontrado' }
    }

    return {
      success: true,
      data: {
        user: assignedUser,
      },
    }
  } catch (error) {
    console.error('Error al descifrar asignación:', error)
    return {
      success: false,
      error: 'Error al descifrar. Verifica tu contraseña.',
    }
  }
}
