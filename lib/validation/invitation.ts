import { z } from 'zod'

export const invitationSchema = z.object({
  email: z.string().trim().email('Ingresa un email valido'),
})

export type InvitationInput = z.infer<typeof invitationSchema>
