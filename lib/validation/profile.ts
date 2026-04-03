import { z } from 'zod'

export const updateProfileSchema = z.object({
  name: z.string().trim().max(100, 'El nombre es demasiado largo').optional().or(z.literal('')),
  email: z.string().trim().email('Ingresa un email valido'),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contrasena actual es obligatoria'),
    newPassword: z.string().min(6, 'La nueva contrasena debe tener al menos 6 caracteres'),
    confirmPassword: z.string().min(6, 'La nueva contrasena debe tener al menos 6 caracteres'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contrasenas no coinciden',
    path: ['confirmPassword'],
  })

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
