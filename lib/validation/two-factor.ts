import { z } from 'zod'

export const enableTwoFactorSchema = z.object({
  secret: z.string().trim().min(1, 'Secret requerido'),
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'El codigo debe tener 6 digitos'),
})

export const disableTwoFactorSchema = z.object({
  password: z.string().min(1, 'Contrasena requerida'),
})

export type EnableTwoFactorInput = z.infer<typeof enableTwoFactorSchema>
export type DisableTwoFactorInput = z.infer<typeof disableTwoFactorSchema>
