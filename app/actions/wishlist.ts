'use server'

import { revalidatePath } from 'next/cache'

import { auth } from '@/auth'
import type { ActionResult } from '@/lib/action-result'
import { prisma } from '@/lib/prisma'
import {
  createWishListItemSchema,
  deleteWishListItemSchema,
  getWishListSchema,
  updateWishListPurchaseSchema,
  type CreateWishListItemInput,
  type GetWishListInput,
  type UpdateWishListPurchaseInput,
} from '@/lib/validation/wishlist'

interface WishListItemData {
  id: number
  item: string
  priority: number
  link: string | null
  isPurchased: boolean
  createdAt: Date
}

function revalidateWishListPaths(eventId: number) {
  revalidatePath('/mis-eventos')
  revalidatePath('/mi-asignacion')
  revalidatePath(`/eventos/${eventId}`)
}

export async function getWishListAction(
  values: GetWishListInput
): Promise<ActionResult<WishListItemData[]>> {
  const parsed = getWishListSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Datos invalidos',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: 'No autenticado' }

    const targetUserId = parsed.data.userId ?? parseInt(session.user.id)

    const items = await prisma.wishList.findMany({
      where: {
        eventId: parsed.data.eventId,
        userId: targetUserId,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    })

    return {
      success: true,
      data: items,
    }
  } catch (error) {
    console.error('Error al obtener wishlist:', error)
    return {
      success: false,
      error: 'Error al obtener lista de deseos',
    }
  }
}

export async function createWishListItemAction(values: CreateWishListItemInput): Promise<ActionResult> {
  const parsed = createWishListItemSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Revisa los datos del formulario',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: 'No autenticado' }

    const participant = await prisma.eventParticipant.findUnique({
      where: {
        eventId_userId: {
          eventId: parsed.data.eventId,
          userId: parseInt(session.user.id),
        },
      },
    })

    if (!participant) {
      return { success: false, error: 'No estas participando en este evento' }
    }

    await prisma.wishList.create({
      data: {
        userId: parseInt(session.user.id),
        eventId: parsed.data.eventId,
        item: parsed.data.item,
        priority: parsed.data.priority,
        link: parsed.data.link || null,
      },
    })

    revalidateWishListPaths(parsed.data.eventId)

    return { success: true, message: 'Item agregado a la lista' }
  } catch (error) {
    console.error('Error al crear item wishlist:', error)
    return { success: false, error: 'Error al crear item' }
  }
}

export async function deleteWishListItemAction(id: number): Promise<ActionResult> {
  const parsed = deleteWishListItemSchema.safeParse({ id })
  if (!parsed.success) {
    return { success: false, error: 'Item invalido' }
  }

  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: 'No autenticado' }

    const existingItem = await prisma.wishList.findUnique({ where: { id: parsed.data.id } })
    if (!existingItem) return { success: false, error: 'Item no encontrado' }

    if (existingItem.userId !== parseInt(session.user.id)) {
      return { success: false, error: 'No autorizado' }
    }

    await prisma.wishList.delete({ where: { id: parsed.data.id } })

    revalidateWishListPaths(existingItem.eventId)

    return { success: true, message: 'Item eliminado' }
  } catch (error) {
    console.error('Error al eliminar item wishlist:', error)
    return { success: false, error: 'Error al eliminar item' }
  }
}

export async function updateWishListPurchasedAction(values: UpdateWishListPurchaseInput): Promise<ActionResult> {
  const parsed = updateWishListPurchaseSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Datos invalidos',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: 'No autenticado' }

    const existingItem = await prisma.wishList.findUnique({ where: { id: parsed.data.id } })
    if (!existingItem) return { success: false, error: 'Item no encontrado' }

    if (existingItem.userId !== parseInt(session.user.id)) {
      const assignment = await prisma.assignment.findFirst({
        where: {
          eventId: existingItem.eventId,
          userId: parseInt(session.user.id),
        },
      })

      if (!assignment) {
        return { success: false, error: 'No tienes asignacion en este evento' }
      }
    }

    await prisma.wishList.update({
      where: { id: parsed.data.id },
      data: { isPurchased: parsed.data.isPurchased },
    })

    revalidateWishListPaths(existingItem.eventId)

    return { success: true, message: 'Estado actualizado' }
  } catch (error) {
    console.error('Error al actualizar wishlist:', error)
    return { success: false, error: 'Error al actualizar item' }
  }
}
