'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { joinEventAction, leaveEventAction } from '@/app/actions/event-participation'
import { useToast } from '@/components/ToastProvider'

interface Evento {
  id: number
  name: string
  description: string | null
  year: number
  eventDate: Date | null
  isActive: boolean
  isDrawn: boolean
}

interface EventoCardProps {
  evento: Evento
  participantCount: number
  isParticipating: boolean
  userId: number
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function EventoCard({ evento, participantCount, isParticipating, userId }: EventoCardProps) {
  const router = useRouter()
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  async function handleJoin() {
    if (!confirm(`¿Inscribirte en "${evento.name}"?`)) {
      return
    }

    setLoading(true)

    try {
      const result = await joinEventAction(evento.id)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success(result.message ?? 'Te has inscrito exitosamente')
      router.refresh()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleLeave() {
    if (!confirm(`¿Salirte de "${evento.name}"?\n\nSolo puedes salirte si el sorteo aún no se ha realizado.`)) {
      return
    }

    setLoading(true)

    try {
      const result = await leaveEventAction(evento.id)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success(result.message ?? 'Te has salido del evento')
      router.refresh()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-all">
      {/* Header with gradient */}
      <div className="bg-linear-to-r from-blue-600 to-green-600 p-6 text-white">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-bold leading-tight">
            {evento.name}
          </h3>
          {evento.isDrawn && (
            <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-semibold whitespace-nowrap ml-2">
              ✓ Sorteado
            </span>
          )}
        </div>
        {evento.description && (
          <p className="text-sm text-blue-100 line-clamp-2">
            {evento.description}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <span>📅</span>
            <span>Año {evento.year}</span>
          </div>
          {evento.eventDate && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <span>🎁</span>
              <span>{new Date(evento.eventDate).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <span>👥</span>
            <span>{participantCount} participantes</span>
          </div>
        </div>

        {/* Status Badge */}
        {isParticipating && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span className="text-sm font-semibold text-green-700 dark:text-green-300">
              Estás inscrito
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          {isParticipating ? (
            <div className="flex gap-2">
              {evento.isDrawn && (
                <Link
                  href="/mi-asignacion"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-center text-sm font-semibold transition-colors"
                >
                  🎁 Ver Asignación
                </Link>
              )}
              {!evento.isDrawn && (
                <button
                  onClick={handleLeave}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '⏳' : '🚪'} Salirme
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleJoin}
              disabled={loading || evento.isDrawn}
              className="w-full px-4 py-2 bg-linear-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Inscribiendo...' : evento.isDrawn ? '🔒 Sorteo realizado' : '➕ Inscribirme'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
