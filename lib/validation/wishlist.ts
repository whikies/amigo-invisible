import { z } from 'zod'

export const createWishListItemSchema = z.object({
  eventId: z.number().int().positive('Evento invalido'),
  item: z.string().trim().min(1, 'Descripcion requerida'),
  priority: z.number().int().min(0).max(2).default(0),
  link: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((value) => !value || /^https?:\/\//i.test(value), {
      message: 'El link debe iniciar con http:// o https://',
    }),
})

export const getWishListSchema = z.object({
  eventId: z.number().int().positive('Evento invalido'),
  userId: z.number().int().positive('Usuario invalido').optional(),
})

export const createWishListFormSchema = createWishListItemSchema.omit({
  eventId: true,
})

export const updateWishListPurchaseSchema = z.object({
  id: z.number().int().positive('Item invalido'),
  isPurchased: z.boolean(),
})

export const deleteWishListItemSchema = z.object({
  id: z.number().int().positive('Item invalido'),
})

export type CreateWishListItemInput = z.infer<typeof createWishListItemSchema>
export type CreateWishListFormInput = z.infer<typeof createWishListFormSchema>
export type GetWishListInput = z.infer<typeof getWishListSchema>
export type UpdateWishListPurchaseInput = z.infer<typeof updateWishListPurchaseSchema>
