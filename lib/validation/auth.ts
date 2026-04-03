import { z } from 'zod'

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Ingresa un email valido'),
})

export const checkTwoFactorSchema = z.object({
  email: z.string().trim().email('Ingresa un email valido'),
  password: z.string().min(1, 'La contrasena es obligatoria'),
})

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, 'Token invalido'),
    password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres'),
    confirmPassword: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contrasenas no coinciden',
    path: ['confirmPassword'],
  })

export const registerSchema = z
  .object({
    invitationCode: z
      .string()
      .trim()
      .toUpperCase()
      .length(8, 'El codigo de invitacion debe tener 8 caracteres'),
    name: z.string().trim().min(1, 'El nombre es obligatorio'),
    email: z.string().trim().email('Ingresa un email valido'),
    password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres'),
    confirmPassword: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contrasenas no coinciden',
    path: ['confirmPassword'],
  })

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type CheckTwoFactorInput = z.infer<typeof checkTwoFactorSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type RegisterInput = z.infer<typeof registerSchema>
