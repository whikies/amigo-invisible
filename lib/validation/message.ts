import { z } from 'zod'

export const sendMessageSchema = z.object({
  eventId: z.number().int().positive(),
  receiverId: z.number().int().positive(),
  content: z.string().trim().min(1, 'El mensaje es obligatorio').max(2000),
  isAnonymous: z.boolean().optional(),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>

export const getMessagesSchema = z.object({
  eventId: z.number().int().positive(),
})

export type GetMessagesInput = z.infer<typeof getMessagesSchema>

export const getChatParticipantsSchema = z.object({
  eventId: z.number().int().positive(),
})

export type GetChatParticipantsInput = z.infer<typeof getChatParticipantsSchema>

export const markMessageReadSchema = z.object({
  messageId: z.number().int().positive(),
})

export type MarkMessageReadInput = z.infer<typeof markMessageReadSchema>
