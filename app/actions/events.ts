'use server'

import { revalidatePath } from 'next/cache'

import { auth } from '@/auth'
import type { ActionResult } from '@/lib/action-result'
import { prisma } from '@/lib/prisma'
import {
  createEventSchema,
  updateEventSchema,
  type CreateEventInput,
  type UpdateEventInput,
} from '@/lib/validation/event'

async function requireAdmin() {
  const session = await auth()

  if (!session?.user) {
    return { error: 'No autenticado' }
  }

  if (session.user.role !== 'admin') {
    return { error: 'No tienes permisos para realizar esta accion' }
  }

  return { session }
}

export async function createEventAction(
  values: CreateEventInput
): Promise<ActionResult<{ eventId: number }>> {
  const parsed = createEventSchema().safeParse(values)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Revisa los datos del formulario',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const authState = await requireAdmin()
  if ('error' in authState) {
    return {
      success: false,
      error: authState.error,
    }
  }

  const { name, description, year, eventDate, drawDate, isActive } = parsed.data

  try {
    const event = await prisma.event.create({
      data: {
        name,
        description: description || null,
        year,
        eventDate: eventDate ? new Date(eventDate) : null,
        drawDate: drawDate ? new Date(drawDate) : null,
        isActive,
        isDrawn: false,
      },
    })

    revalidatePath('/admin/eventos')
    revalidatePath('/eventos')

    return {
      success: true,
      message: 'Evento creado exitosamente',
      data: {
        eventId: event.id,
      },
    }
  } catch (error) {
    console.error('Error al crear evento:', error)
    return {
      success: false,
      error: 'Error interno al crear el evento',
    }
  }
}

export async function updateEventAction(
  eventId: number,
  values: UpdateEventInput
): Promise<ActionResult> {
  const parsed = updateEventSchema().safeParse(values)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Revisa los datos del formulario',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const authState = await requireAdmin()
  if ('error' in authState) {
    return {
      success: false,
      error: authState.error,
    }
  }

  try {
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!existingEvent) {
      return {
        success: false,
        error: 'Evento no encontrado',
      }
    }

    if (existingEvent.isDrawn && !parsed.data.isActive) {
      return {
        success: false,
        error: 'No puedes desactivar un evento que ya ha sido sorteado',
      }
    }

    await prisma.event.update({
      where: { id: eventId },
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        year: parsed.data.year,
        eventDate: parsed.data.eventDate ? new Date(parsed.data.eventDate) : null,
        drawDate: parsed.data.drawDate ? new Date(parsed.data.drawDate) : null,
        isActive: parsed.data.isActive,
      },
    })

    revalidatePath('/admin/eventos')
    revalidatePath(`/admin/eventos/${eventId}`)
    revalidatePath(`/admin/eventos/${eventId}/editar`)
    revalidatePath('/eventos')

    return {
      success: true,
      message: 'Evento actualizado exitosamente',
    }
  } catch (error) {
    console.error('Error al actualizar evento:', error)
    return {
      success: false,
      error: 'Error interno al actualizar el evento',
    }
  }
}

export async function deleteEventAction(eventId: number): Promise<ActionResult> {
  const authState = await requireAdmin()
  if ('error' in authState) {
    return {
      success: false,
      error: authState.error,
    }
  }

  try {
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!existingEvent) {
      return {
        success: false,
        error: 'Evento no encontrado',
      }
    }

    if (existingEvent.isDrawn) {
      return {
        success: false,
        error: 'No puedes eliminar un evento que ya ha sido sorteado. Considera desactivarlo en su lugar.',
      }
    }

    await prisma.event.delete({
      where: { id: eventId },
    })

    revalidatePath('/admin/eventos')
    revalidatePath('/eventos')

    return {
      success: true,
      message: 'Evento eliminado exitosamente',
    }
  } catch (error) {
    console.error('Error al eliminar evento:', error)
    return {
      success: false,
      error: 'Error interno al eliminar el evento',
    }
  }
}
