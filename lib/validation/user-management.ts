import { z } from 'zod'

export const userRoleSchema = z.enum(['user', 'admin'])

export const createUserSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
  email: z.string().trim().email('Email invalido'),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres'),
  role: userRoleSchema.default('user'),
  isActive: z.boolean().default(true),
})

export const updateUserSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido').optional(),
  email: z.string().trim().email('Email invalido').optional(),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres').optional().or(z.literal('')),
  role: userRoleSchema.optional(),
  isActive: z.boolean().optional(),
})

export const createExclusionSchema = z
  .object({
    userId: z.number().int().positive('Usuario 1 invalido'),
    excludedUserId: z.number().int().positive('Usuario 2 invalido'),
    reason: z.string().trim().optional().or(z.literal('')),
  })
  .refine((value) => value.userId !== value.excludedUserId, {
    path: ['excludedUserId'],
    message: 'No puedes excluir un usuario consigo mismo',
  })

export const addParticipantsSchema = z.object({
  eventId: z.number().int().positive('Evento invalido'),
  userIds: z.array(z.number().int().positive('Usuario invalido')).min(1, 'Selecciona al menos un usuario'),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type CreateExclusionInput = z.infer<typeof createExclusionSchema>
export type AddParticipantsInput = z.infer<typeof addParticipantsSchema>
