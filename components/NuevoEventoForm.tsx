'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function NuevoEventoForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      year: parseInt(formData.get('year') as string),
      eventDate: formData.get('eventDate') as string,
      drawDate: formData.get('drawDate') as string,
      isActive: formData.get('isActive') === 'on'
    }

    try {
      const response = await fetch('/api/eventos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear el evento')
      }

      alert('✅ Evento creado exitosamente')
      router.push(`/admin/eventos/${result.event.id}`)
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
          min={currentYear}
          max={currentYear + 10}
          defaultValue={currentYear}
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
          defaultChecked
          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
        <label htmlFor="isActive" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Evento activo (los usuarios podrán verlo y participar)
        </label>
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          💡 <strong>Nota:</strong> Después de crear el evento, podrás agregar participantes y realizar el sorteo desde la página del evento.
        </p>
      </div>

      {/* Botones */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-linear-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {loading ? '⏳ Creando...' : '✅ Crear Evento'}
        </button>
        <Link
          href="/admin/eventos"
          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold text-center"
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}
