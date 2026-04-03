'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Event {
  id: number
  name: string
  description: string | null
  year: number
  eventDate: Date | null
  drawDate: Date | null
  isActive: boolean
  isDrawn: boolean
}

interface EditEventoFormProps {
  event: Event
}

export function EditEventoForm({ event }: EditEventoFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Función helper para formatear fechas a formato YYYY-MM-DD
  const formatDate = (date: Date | null) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toISOString().split('T')[0]
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      year: parseInt(formData.get('year') as string),
      eventDate: formData.get('eventDate') as string,
      drawDate: formData.get('drawDate') as string,
      isActive: formData.get('isActive') === 'on'
    }

    try {
      const response = await fetch(`/api/eventos/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar el evento')
      }

      alert('✅ Evento actualizado exitosamente')
      router.push(`/admin/eventos/${event.id}`)
      router.refresh()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`⚠️ ¿Estás seguro de que deseas eliminar el evento "${event.name}"?\n\nEsta acción no se puede deshacer.`)) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/eventos/${event.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar el evento')
      }

      alert('✅ Evento eliminado exitosamente')
      router.push('/admin/eventos')
      router.refresh()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Advertencia si ya fue sorteado */}
      {event.isDrawn && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-300">
          ⚠️ <strong>Atención:</strong> Este evento ya ha sido sorteado. Algunos cambios pueden afectar las asignaciones existentes.
        </div>
      )}

      {/* Nombre */}
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Nombre del Evento *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={event.name}
          placeholder="Ej: Amigo Invisible Reyes Magos 2026"
          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Descripción */}
      <div>
        <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={event.description || ''}
          placeholder="Describe el evento (opcional)"
          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Año */}
      <div>
        <label htmlFor="year" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Año *
        </label>
        <input
          type="number"
          id="year"
          name="year"
          required
          min={currentYear - 5}
          max={currentYear + 10}
          defaultValue={event.year}
          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fecha del evento */}
        <div>
          <label htmlFor="eventDate" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Fecha del Evento
          </label>
          <input
            type="date"
            id="eventDate"
            name="eventDate"
            defaultValue={formatDate(event.eventDate)}
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Día del intercambio de regalos
          </p>
        </div>

        {/* Fecha del sorteo */}
        <div>
          <label htmlFor="drawDate" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Fecha del Sorteo
          </label>
          <input
            type="date"
            id="drawDate"
            name="drawDate"
            defaultValue={formatDate(event.drawDate)}
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Día en que se realizará el sorteo
          </p>
        </div>
      </div>

      {/* Estado Activo */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          defaultChecked={event.isActive}
          disabled={event.isDrawn}
          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <label htmlFor="isActive" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Evento activo (los usuarios podrán verlo y participar)
          {event.isDrawn && <span className="text-yellow-600 ml-2">(no se puede desactivar después del sorteo)</span>}
        </label>
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          💡 <strong>Nota:</strong> Los cambios en las fechas y descripción no afectarán las asignaciones existentes. Sin embargo, ten cuidado al modificar el nombre del evento.
        </p>
      </div>

      {/* Botones */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-linear-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {loading ? '⏳ Guardando...' : '💾 Guardar Cambios'}
        </button>
        <Link
          href={`/admin/eventos/${event.id}`}
          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold text-center"
        >
          Cancelar
        </Link>
        {!event.isDrawn && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🗑️ Eliminar
          </button>
        )}
      </div>
    </form>
  )
}
