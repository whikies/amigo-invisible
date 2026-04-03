'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getEventHistoryAction, exportEventsHistoryAction } from '@/app/actions/history'
import type { EventHistoryItem } from '@/app/actions/history'

export function HistorialContent() {
  const [events, setEvents] = useState<EventHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const result = await getEventHistoryAction()
      if (!result.success) throw new Error(result.error || 'Error al cargar historial')

      setEvents(result.data || [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const result = await exportEventsHistoryAction(format)
      if (!result.success || !result.data) {
        console.error('Error al exportar:', result.error)
        return
      }

      const blob = new Blob([result.data.data], {
        type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json',
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.data.filename
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      console.error('Error al exportar')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <p className="text-red-800 dark:text-red-200">Error al cargar el historial</p>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <svg className="w-24 h-24 mx-auto mb-4 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No hay eventos aún
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Comienza participando en tu primer evento
        </p>
        <Link
          href="/mis-eventos"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
        >
          Ver Eventos Disponibles
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Export buttons */}
      <div className="flex justify-end gap-3 mb-6">
        <button
          onClick={() => handleExport('csv')}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium"
        >
          📥 Exportar CSV
        </button>
        <button
          onClick={() => handleExport('json')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
        >
          📥 Exportar JSON
        </button>
      </div>

      {/* Events list */}
      <div className="grid gap-6">
        {events.map((event) => (
          <div
            key={event.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {event.name}
                  </h3>
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    {event.year}
                  </span>
                  {event.stats.isCompleted && (
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                      Finalizado
                    </span>
                  )}
                  {event.isActive && !event.stats.isCompleted && (
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      Activo
                    </span>
                  )}
                </div>

                {event.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    {event.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {event.stats.totalParticipants} participantes
                  </div>

                  {event.drawDate && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Sorteo: {new Date(event.drawDate).toLocaleDateString()}
                    </div>
                  )}

                  {event.eventDate && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                      Evento: {new Date(event.eventDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {event.isActive && (
                  <Link
                    href={`/eventos/${event.id}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
                  >
                    Ver Evento
                  </Link>
                )}
              </div>
            </div>

            {event.stats.hadAssignment && event.isDrawn && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ✅ Participaste en el sorteo de este evento
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
