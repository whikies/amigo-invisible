import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export const runtime = 'nodejs'

export default async function EventosPage() {
  // Verificar autenticación
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const events = await prisma.event.findMany({
    orderBy: { year: 'desc' },
    include: {
      _count: {
        select: {
          participants: true,
          assignments: true
        }
      }
    }
  })

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 mb-4 inline-block"
          >
            ← Volver al inicio
          </Link>
          <h1 className="text-4xl font-bold mb-2 text-gray-800 dark:text-gray-100">
            🎄 Eventos de Sorteo
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Total: <strong>{events.length}</strong> eventos creados
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>📝 Modelo Event:</strong> Representa un sorteo específico (ej: Reyes 2026).
            Tiene nombre, fechas, estado de actividad y si ya se realizó el sorteo.
          </p>
        </div>

        {/* Events List */}
        <div className="space-y-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-gray-100 dark:border-gray-700"
            >
              {/* Event Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {event.name}
                    </h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      event.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {event.isActive ? '✓ Activo' : '✗ Inactivo'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      event.isDrawn
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {event.isDrawn ? '🎁 Sorteo Realizado' : '⏳ Pendiente'}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {event.description}
                    </p>
                  )}
                </div>
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-lg text-sm font-semibold">
                  Año {event.year}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Participantes</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {event._count.participants}
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Asignaciones</div>
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {event._count.assignments}
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Fecha Sorteo</div>
                  <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {event.drawDate ? new Date(event.drawDate).toLocaleDateString('es-ES') : 'No definida'}
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Fecha Evento</div>
                  <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {event.eventDate ? new Date(event.eventDate).toLocaleDateString('es-ES') : 'No definida'}
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="text-xs text-gray-400 dark:text-gray-500 pt-3 border-t border-gray-200 dark:border-gray-700">
                Creado: {new Date(event.createdAt).toLocaleDateString('es-ES')} |
                Actualizado: {new Date(event.updatedAt).toLocaleDateString('es-ES')}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {events.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">
              No hay eventos creados. Ejecuta <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">npm run seed</code>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
