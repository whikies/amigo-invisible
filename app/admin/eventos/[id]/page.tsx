import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { SorteoButton } from '@/components/SorteoButton'
import { ParticipantManager } from '@/components/ParticipantManager'

export const runtime = 'nodejs'

export default async function EventoDetallePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'admin') {
    redirect('/')
  }

  const { id } = await params
  const eventId = parseInt(id)

  if (isNaN(eventId)) {
    notFound()
  }

  // Obtener evento con participantes
  const evento = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              isActive: true
            }
          }
        },
        orderBy: {
          user: {
            name: 'asc'
          }
        }
      },
      assignments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
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

  if (!evento) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/admin/eventos"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              ← Volver a eventos
            </Link>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {evento.name}
              </h1>
              {evento.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {evento.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>📅 Año {evento.year}</span>
                {evento.eventDate && (
                  <span>🎁 Evento: {new Date(evento.eventDate).toLocaleDateString('es-ES')}</span>
                )}
                {evento.drawDate && (
                  <span>🎲 Sorteo: {new Date(evento.drawDate).toLocaleDateString('es-ES')}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 items-end">
              <Link
                href={`/admin/eventos/${evento.id}/editar`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                ✏️ Editar Evento
              </Link>
              {evento.isActive ? (
                <span className="px-4 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-semibold">
                  ✓ Activo
                </span>
              ) : (
                <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full text-sm font-semibold">
                  Inactivo
                </span>
              )}

              {evento.isDrawn && (
                <span className="px-4 py-2 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm font-semibold">
                  ✓ Sorteado
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-gray-100 dark:border-gray-700">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {evento._count.participants}
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-sm">
              Participantes
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-gray-100 dark:border-gray-700">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {evento._count.assignments}
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-sm">
              Asignaciones
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-gray-100 dark:border-gray-700">
            {evento.isActive && evento._count.participants >= 3 ? (
              <SorteoButton
                eventId={evento.id}
                eventName={evento.name}
                isDrawn={evento.isDrawn}
                participantCount={evento._count.participants}
              />
            ) : (
              <div>
                <div className="text-2xl mb-2">🎲</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {!evento.isActive
                    ? 'Evento inactivo'
                    : `Se necesitan ≥3 participantes (actual: ${evento._count.participants})`
                  }
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Participantes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 border-2 border-gray-100 dark:border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            👥 Participantes ({evento._count.participants})
          </h2>

          <ParticipantManager
            eventId={evento.id}
            participants={evento.participants}
          />
        </div>

        {/* Asignaciones (solo si hay sorteo) */}
        {evento.isDrawn && evento.assignments.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 border-2 border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              🔐 Asignaciones ({evento.assignments.length})
            </h2>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800 mb-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                ⚠️ <strong>Las asignaciones están cifradas.</strong> Solo cada usuario puede ver su propia asignación con su contraseña.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {evento.assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-linear-to-r from-blue-600 to-green-600 flex items-center justify-center text-white font-bold">
                      {assignment.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">
                        {assignment.user.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {assignment.user.email}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <span>🔒</span>
                    <span>Asignación cifrada</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
