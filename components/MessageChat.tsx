'use client'

import { useCallback, useState, useEffect } from 'react'
import {
  getChatParticipantsAction,
  getMessagesAction,
  markMessageAsReadAction,
  sendMessageAction,
} from '@/app/actions/messages'
import { useToast } from './ToastProvider'

interface Message {
  id: number
  content: string
  isAnonymous: boolean
  isRead: boolean
  createdAt: Date
  sender: {
    id: number
    name: string
  }
}

interface User {
  id: number
  name: string
  email: string
}

interface MessageChatProps {
  eventId: number
}

export function MessageChat({ eventId }: MessageChatProps) {
  const toast = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [participants, setParticipants] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  // Form state
  const [selectedReceiver, setSelectedReceiver] = useState('')
  const [messageContent, setMessageContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)

  const fetchMessages = useCallback(async () => {
    try {
      const result = await getMessagesAction({ eventId })
      if (!result.success) throw new Error(result.error || 'Error al cargar mensajes')

      setMessages(result.data || [])
    } catch {
      toast.error('Error al cargar mensajes')
    } finally {
      setLoading(false)
    }
  }, [eventId, toast])

  const fetchParticipants = useCallback(async () => {
    try {
      const result = await getChatParticipantsAction({ eventId })
      if (!result.success) throw new Error(result.error || 'Error al cargar participantes')

      setParticipants(result.data || [])
    } catch {
      console.error('Error al cargar participantes')
    }
  }, [eventId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedReceiver || !messageContent.trim()) {
      toast.warning('Selecciona un destinatario y escribe un mensaje')
      return
    }

    setSending(true)
    try {
      const result = await sendMessageAction({
        eventId,
        receiverId: parseInt(selectedReceiver),
        content: messageContent,
        isAnonymous,
      })

      if (!result.success) {
        throw new Error(result.error || 'Error al enviar mensaje')
      }

      await fetchMessages()
      toast.success('Mensaje enviado')
      setMessageContent('')
      setSelectedReceiver('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al enviar mensaje')
    } finally {
      setSending(false)
    }
  }

  const markAsRead = async (messageId: number) => {
    try {
      const result = await markMessageAsReadAction({
        messageId,
      })

      if (!result.success) {
        return
      }

      await fetchMessages()
    } catch {
      console.error('Error al marcar como leído')
    }
  }

  useEffect(() => {
    void fetchMessages()
    void fetchParticipants()
  }, [fetchMessages, fetchParticipants])

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enviar mensaje */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Enviar Mensaje
        </h3>

        <form onSubmit={handleSendMessage} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Destinatario
            </label>
            <select
              value={selectedReceiver}
              onChange={(e) => setSelectedReceiver(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={sending}
            >
              <option value="">Selecciona un participante</option>
              {participants.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mensaje
            </label>
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={sending}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              disabled={sending}
            />
            <label htmlFor="anonymous" className="text-sm text-gray-700 dark:text-gray-300">
              Enviar como anónimo
            </label>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition disabled:opacity-50"
          >
            {sending ? 'Enviando...' : 'Enviar Mensaje'}
          </button>
        </form>
      </div>

      {/* Mensajes recibidos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Mensajes Recibidos
        </h3>

        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p>No tienes mensajes aún</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {messages.map((message) => (
              <li
                key={message.id}
                className={`p-4 rounded-lg border ${
                  message.isRead
                    ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}
                onClick={() => !message.isRead && markAsRead(message.id)}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {message.isAnonymous ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                        🎭 Anónimo
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        De: {message.sender.name}
                      </span>
                    )}
                    {!message.isRead && (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        Nuevo
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(message.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">{message.content}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
