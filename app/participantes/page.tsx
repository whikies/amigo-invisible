import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export const runtime = 'nodejs'

export default async function ParticipantesPage() {
  // Verificar autenticación
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const events = await prisma.event.findMany({
    orderBy: { year: 'desc' },
    include: {
      participants: {
        include: {
          user: true
        },
        orderBy: {
          user: {
            name: 'asc'
          }
        }
      },
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
            🎁 Participantes por Evento
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Usuarios inscritos en cada sorteo
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Un usuario puede participar en múltiples eventos, pero solo una vez por evento.
          </p>
        </div>

        {/* Events with Participants */}
        <div className="space-y-8">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              {/* Event Header */}
              <div className="bg-linear-to-r from-purple-500 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{event.name}</h2>
                    <p className="text-purple-100">Año {event.year}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{event._count.participants}</div>
                    <div className="text-sm text-purple-100">participantes</div>
                  </div>
                </div>
              </div>

              {/* Participants List */}
              <div className="p-6">
                {event.participants.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {event.participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center font-bold text-purple-800 dark:text-purple-200">
                          {participant.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800 dark:text-gray-100">
                            {participant.user.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {participant.user.email}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          ID: {participant.user.id}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No hay participantes inscritos en este evento
                  </div>
                )}

                {/* Event Stats */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Inscritos</div>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {event._count.participants}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Asignaciones</div>
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {event._count.assignments}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Estado</div>
                      <div className={`text-sm font-bold ${
                        event.isDrawn
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-orange-600 dark:text-orange-400'
                      }`}>
                        {event.isDrawn ? '✓ Sorteado' : '⏳ Pendiente'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {events.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">
              No hay eventos creados.
            </p>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 border-2 border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-lg mb-3 text-gray-800 dark:text-gray-100">
            💡 Flujo de participación
          </h3>
          <ol className="space-y-2 text-gray-600 dark:text-gray-300 text-sm list-decimal list-inside">
            <li>Se crea un evento (ej: &quot;Reyes Magos 2026&quot;)</li>
            <li>Los usuarios se <strong>inscriben</strong> al evento</li>
            <li>Se registran en <code>EventParticipant</code></li>
            <li>Cuando hay suficientes participantes, se realiza el sorteo</li>
            <li>El sorteo respeta las exclusiones de cada participante</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
