'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from './ToastProvider'

interface Invitation {
  id: number
  email: string
  code: string
  used: boolean
  expiresAt: string
  createdAt: string
}

export function InvitationManager() {
  const toast = useToast()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [email, setEmail] = useState('')
  const [showForm, setShowForm] = useState(false)

  const fetchInvitations = useCallback(async () => {
    try {
      const response = await fetch('/api/invitations')
      if (!response.ok) throw new Error('Error al cargar invitaciones')

      const data = await response.json()
      setInvitations(data.invitations || [])
    } catch {
      toast.error('Error al cargar invitaciones')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchInvitations()
  }, [fetchInvitations])

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      toast.warning('El email es requerido')
      return
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Email inválido')
      return
    }

    setSending(true)

    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar invitación')
      }

      toast.success(`¡Invitación enviada a ${email}!`)
      setEmail('')
      setShowForm(false)
      fetchInvitations()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al enviar invitación')
    } finally {
      setSending(false)
    }
  }

  const copyToClipboard = (code: string, email: string) => {
    const inviteUrl = `${window.location.origin}/register?code=${code}&email=${encodeURIComponent(email)}`
    navigator.clipboard.writeText(inviteUrl)
    toast.success('Link de invitación copiado')
  }

  const getStatusBadge = (invitation: Invitation) => {
    if (invitation.used) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
          ✓ Usada
        </span>
      )
    }

    const isExpired = new Date(invitation.expiresAt) < new Date()
    if (isExpired) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
          ⚠ Expirada
        </span>
      )
    }

    return (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
        ◉ Pendiente
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con botón */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Invitaciones
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Invita a otras personas a unirse a la plataforma
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-linear-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all font-semibold shadow-lg"
        >
          {showForm ? '✕ Cancelar' : '✉ Nueva Invitación'}
        </button>
      </div>

      {/* Formulario de nueva invitación */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-blue-200 dark:border-blue-800 animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Enviar Nueva Invitación
          </h3>

          <form onSubmit={handleSendInvitation} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email del invitado
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@email.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={sending}
                required
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Se enviará un email con el código de invitación. La invitación será válida por 7 días.
              </p>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition disabled:opacity-50"
            >
              {sending ? 'Enviando...' : '✉ Enviar Invitación'}
            </button>
          </form>
        </div>
      )}

      {/* Lista de invitaciones */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Invitaciones Enviadas ({invitations.length})
        </h3>

        {invitations.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
            </svg>
            <p className="font-medium">No has enviado invitaciones aún</p>
            <p className="text-sm mt-1">Haz clic en &quot;Nueva Invitación&quot; para comenzar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {invitation.email}
                      </p>
                      {getStatusBadge(invitation)}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-900 dark:text-white">
                          {invitation.code}
                        </span>
                        {!invitation.used && new Date(invitation.expiresAt) > new Date() && (
                          <button
                            onClick={() => copyToClipboard(invitation.code, invitation.email)}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Copiar link de invitación"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <p>Enviada: {formatDate(invitation.createdAt)}</p>
                      <p>Expira: {formatDate(invitation.expiresAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
