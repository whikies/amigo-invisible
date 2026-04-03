'use server'

import { revalidatePath } from 'next/cache'

import { auth } from '@/auth'
import type { ActionResult } from '@/lib/action-result'
import { prisma } from '@/lib/prisma'

export interface NotificationData {
  id: number
  type: string
  title: string
  message: string
  link: string | null
  isRead: boolean
  createdAt: Date
}

export interface NotificationsResponse {
  notifications: NotificationData[]
  unreadCount: number
}

function revalidateNotificationPaths() {
  revalidatePath('/notificaciones')
  revalidatePath('/dashboard')
}

export async function getNotificationsAction(): Promise<
  ActionResult<NotificationsResponse>
> {
  try {
    const session = await auth()

    if (!session?.user) {
      return { success: false, error: 'No autorizado' }
    }

    const userId = parseInt(session.user.id)

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
    ])

    return {
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    }
  } catch (error) {
    console.error('Error al obtener notificaciones:', error)
    return {
      success: false,
      error: 'Error interno al obtener notificaciones',
    }
  }
}

export async function markNotificationAsReadAction(notificationId: number): Promise<ActionResult> {
  try {
    const session = await auth()

    if (!session?.user) {
      return { success: false, error: 'No autorizado' }
    }

    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      return { success: false, error: 'ID invalido' }
    }

    const userId = parseInt(session.user.id)

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification) {
      return { success: false, error: 'Notificacion no encontrada' }
    }

    if (notification.userId !== userId) {
      return { success: false, error: 'No tienes permisos para marcar esta notificacion' }
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    })

    revalidateNotificationPaths()

    return { success: true }
  } catch (error) {
    console.error('Error al marcar notificacion:', error)
    return {
      success: false,
      error: 'Error interno al actualizar notificacion',
    }
  }
}

export async function markAllNotificationsAsReadAction(): Promise<ActionResult> {
  try {
    const session = await auth()

    if (!session?.user) {
      return { success: false, error: 'No autorizado' }
    }

    const userId = parseInt(session.user.id)

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    })

    revalidateNotificationPaths()

    return {
      success: true,
      message: 'Todas las notificaciones marcadas como leidas',
    }
  } catch (error) {
    console.error('Error al marcar todas las notificaciones:', error)
    return {
      success: false,
      error: 'Error interno al actualizar notificaciones',
    }
  }
}

export async function deleteNotificationAction(notificationId: number): Promise<ActionResult> {
  try {
    const session = await auth()

    if (!session?.user) {
      return { success: false, error: 'No autorizado' }
    }

    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      return { success: false, error: 'ID invalido' }
    }

    const userId = parseInt(session.user.id)

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification) {
      return { success: false, error: 'Notificacion no encontrada' }
    }

    if (notification.userId !== userId) {
      return { success: false, error: 'No tienes permisos para eliminar esta notificacion' }
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    })

    revalidateNotificationPaths()

    return {
      success: true,
      message: 'Notificacion eliminada',
    }
  } catch (error) {
    console.error('Error al eliminar notificacion:', error)
    return {
      success: false,
      error: 'Error interno al eliminar notificacion',
    }
  }
}
