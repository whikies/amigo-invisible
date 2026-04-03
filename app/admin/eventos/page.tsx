import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { SorteoButton } from '@/components/SorteoButton'

export const runtime = 'nodejs'

export default async function AdminEventosPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'admin') {
    redirect('/')
  }

  const eventos = await prisma.event.findMany({
    include: {
      _count: {
        select: {
          participants: true,
          assignments: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const totalEventos = eventos.length
  const eventosActivos = eventos.filter(e => e.isActive).length
  const eventosSorteados = eventos.filter(e => e.isDrawn).length

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                🎯 Panel de Administración - Eventos
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gestiona eventos y realiza sorteos de amigo invisible
              </p>
            </div>
            <Link
              href="/admin/eventos/nuevo"
              className="px-6 py-3 bg-linear-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all font-semibold shadow-lg"
            >
              ➕ Nuevo Evento
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-gray-100 dark:border-gray-700">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {totalEventos}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                Total Eventos
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-gray-100 dark:border-gray-700">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                {eventosActivos}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                Eventos Activos
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-gray-100 dark:border-gray-700">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {eventosSorteados}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                Sorteos Realizados
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Eventos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Evento
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Fechas
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Participantes
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Sorteo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {eventos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No hay eventos creados. Crea tu primer evento para comenzar.
                    </td>
                  </tr>
                ) : (
                  eventos.map((evento) => (
                    <tr key={evento.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {evento.name}
                          </div>
                        </div>
                        {evento.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {evento.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {evento.eventDate ? new Date(evento.eventDate).toLocaleDateString('es-ES') : 'Sin fecha'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Sorteo: {evento.drawDate ? new Date(evento.drawDate).toLocaleDateString('es-ES') : 'Pendiente'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white font-semibold">
                          {evento._count.participants} participantes
                        </div>
                        {evento._count.assignments > 0 && (
                          <div className="text-xs text-purple-600 dark:text-purple-400">
                            {evento._count.assignments} asignaciones
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {evento.isActive ? (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Activo
                          </span>
                        ) : (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {evento.isDrawn ? (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            ✓ Sorteado
                          </span>
                        ) : (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {evento.isActive && evento._count.participants >= 3 ? (
                          <SorteoButton
                            eventId={evento.id}
                            eventName={evento.name}
                            isDrawn={evento.isDrawn}
                            participantCount={evento._count.participants}
                          />
                        ) : (
                          <button
                            disabled
                            className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed text-xs"
                            title={
                              !evento.isActive
                                ? "Evento inactivo"
                                : "Se necesitan al menos 3 participantes"
                            }
                          >
                            🎲 No disponible
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/eventos/${evento.id}`}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                          >
                            👁️ Ver
                          </Link>
                          <Link
                            href={`/admin/eventos/${evento.id}/editar`}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
                          >
                            ✏️ Editar
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Navegación */}
        <div className="mt-8 flex justify-between items-center">
          <Link
            href="/"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            ← Volver al inicio
          </Link>
          <div className="flex gap-4">
            <Link
              href="/admin/usuarios"
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg font-semibold transition-colors"
            >
              👥 Gestionar Usuarios
            </Link>
            <Link
              href="/admin/exclusiones"
              className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg font-semibold transition-colors"
            >
              🚫 Gestionar Exclusiones
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
