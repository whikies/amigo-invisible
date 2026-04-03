import Link from 'next/link'

interface Event {
  id: number
  name: string
  eventDate: Date | null
  isDrawn: boolean
}

interface UpcomingEventsProps {
  events: Event[]
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  if (events.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          📅 Próximos Eventos
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
          No tienes eventos próximos programados
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-100 dark:border-gray-700">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        📅 Próximos Eventos
      </h3>
      <div className="space-y-4">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/mis-eventos`}
            className="block p-4 bg-linear-to-r from-blue-50 to-green-50 dark:from-gray-700 dark:to-gray-700 rounded-lg hover:shadow-md transition-shadow border border-blue-100 dark:border-gray-600"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {event.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  📅 {event.eventDate
                    ? new Date(event.eventDate).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Fecha por confirmar'}
                </p>
              </div>
              {event.isDrawn && (
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-semibold rounded-full">
                  ✓ Sorteado
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
