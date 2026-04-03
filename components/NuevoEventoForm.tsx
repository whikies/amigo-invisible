'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'

import { createEventAction } from '@/app/actions/events'
import { useToast } from '@/components/ToastProvider'
import { applyActionErrors } from '@/lib/form-errors'
import { createEventSchema } from '@/lib/validation/event'

export function NuevoEventoForm() {
  const router = useRouter()
  const currentYear = new Date().getFullYear()
  const toast = useToast()
  const schema = createEventSchema(currentYear)
  type FormValuesInput = z.input<typeof schema>
  type FormValuesOutput = z.output<typeof schema>
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValuesInput, unknown, FormValuesOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      year: currentYear,
      eventDate: '',
      drawDate: '',
      isActive: true,
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    const result = await createEventAction(values)

    if (!result.success) {
      applyActionErrors(result, setError)
      toast.error(result.error ?? 'Error al crear el evento')
      return
    }

    toast.success(result.message ?? 'Evento creado exitosamente')
    router.push(`/admin/eventos/${result.data?.eventId}`)
    router.refresh()
  })

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {errors.root?.serverError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
          {errors.root.serverError.message}
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
          placeholder="Ej: Amigo Invisible Reyes Magos 2026"
          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          {...register('name')}
        />
        {errors.name && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>}
      </div>

      {/* Descripción */}
      <div>
        <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Descripción
        </label>
        <textarea
          id="description"
          rows={3}
          placeholder="Describe el evento (opcional)"
          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          {...register('description')}
        />
        {errors.description && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>}
      </div>

      {/* Año */}
      <div>
        <label htmlFor="year" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Año *
        </label>
        <input
          type="number"
          id="year"
          min={currentYear}
          max={currentYear + 10}
          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          {...register('year', { valueAsNumber: true })}
        />
        {errors.year && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.year.message}</p>}
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
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            {...register('eventDate')}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Día del intercambio de regalos
          </p>
          {errors.eventDate && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.eventDate.message}</p>}
        </div>

        {/* Fecha del sorteo */}
        <div>
          <label htmlFor="drawDate" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Fecha del Sorteo
          </label>
          <input
            type="date"
            id="drawDate"
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            {...register('drawDate')}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Día en que se realizará el sorteo
          </p>
          {errors.drawDate && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.drawDate.message}</p>}
        </div>
      </div>

      {/* Estado Activo */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isActive"
          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          {...register('isActive')}
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
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 bg-linear-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {isSubmitting ? '⏳ Creando...' : '✅ Crear Evento'}
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
