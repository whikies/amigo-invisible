'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SorteoButtonProps {
  eventId: number
  eventName: string
  isDrawn: boolean
  participantCount: number
}

export function SorteoButton({ eventId, eventName, isDrawn, participantCount }: SorteoButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  async function handleSorteo() {
    if (isDrawn) {
      const confirmMessage = `El evento "${eventName}" ya tiene un sorteo previo.\n\n¿Estás seguro de que quieres realizar un NUEVO sorteo?\n\nEsto eliminará las asignaciones anteriores y creará nuevas.`

      if (!confirm(confirmMessage)) {
        return
      }
    } else {
      const confirmMessage = `¿Realizar sorteo para "${eventName}"?\n\nSe asignarán ${participantCount} participantes respetando las exclusiones configuradas.`

      if (!confirm(confirmMessage)) {
        return
      }
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/eventos/${eventId}/sorteo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al realizar el sorteo')
      }

      alert(`✅ ¡Sorteo completado exitosamente!\n\n${data.assignments} asignaciones creadas.`)
      router.refresh()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error sorteo:', err)
      setError(err.message)
      alert(`❌ Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleSorteo}
        disabled={loading}
        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
          isDrawn
            ? 'bg-purple-600 hover:bg-purple-700 text-white'
            : 'bg-linear-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white'
        } disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg`}
      >
        {loading ? (
          '⏳ Sorteando...'
        ) : isDrawn ? (
          '🔄 Re-sortear'
        ) : (
          '🎲 Realizar Sorteo'
        )}
      </button>
      {error && (
        <div className="text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  )
}
