import { z } from 'zod'

const optionalTextarea = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim()
    return trimmed ? trimmed : ''
  })

const optionalDate = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim()
    return trimmed ? trimmed : ''
  })
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
    message: 'Fecha invalida',
  })

export function createEventSchema(currentYear = new Date().getFullYear()) {
  return z.object({
    name: z.string().trim().min(1, 'El nombre es obligatorio'),
    description: optionalTextarea,
    year: z
      .coerce
      .number({ message: 'El ano es obligatorio' })
      .int('El ano debe ser un numero entero')
      .min(currentYear, `El ano debe ser ${currentYear} o mayor`)
      .max(currentYear + 10, `El ano debe ser ${currentYear + 10} o menor`),
    eventDate: optionalDate,
    drawDate: optionalDate,
    isActive: z.boolean().default(true),
  })
}

export function updateEventSchema(currentYear = new Date().getFullYear()) {
  return z.object({
    name: z.string().trim().min(1, 'El nombre es obligatorio'),
    description: optionalTextarea,
    year: z
      .coerce
      .number({ message: 'El ano es obligatorio' })
      .int('El ano debe ser un numero entero')
      .min(currentYear - 5, `El ano debe ser ${currentYear - 5} o mayor`)
      .max(currentYear + 10, `El ano debe ser ${currentYear + 10} o menor`),
    eventDate: optionalDate,
    drawDate: optionalDate,
    isActive: z.boolean().default(true),
  })
}

export type CreateEventInput = z.infer<ReturnType<typeof createEventSchema>>
export type UpdateEventInput = z.infer<ReturnType<typeof updateEventSchema>>
