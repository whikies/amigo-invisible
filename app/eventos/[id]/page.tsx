import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { WishList } from '@/components/WishList'
import { MessageChat } from '@/components/MessageChat'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EventoDetailsPage({ params }: PageProps) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const { id } = await params
  const eventId = parseInt(id)

  // Obtener evento con participantes
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    }
  })

  if (!event) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Evento no encontrado</h1>
          <Link href="/mis-eventos" className="text-blue-600 dark:text-blue-400 hover:underline">
            ← Volver a mis eventos
          </Link>
        </div>
      </div>
    )
  }

  // Verificar que el usuario es participante
  const isParticipant = event.participants.some(
    (p) => p.userId === parseInt(session.user.id)
  )

  if (!isParticipant) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No tienes acceso a este evento</h1>
          <Link href="/mis-eventos" className="text-blue-600 dark:text-blue-400 hover:underline">
            ← Volver a mis eventos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/mis-eventos" className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
            ← Volver a mis eventos
          </Link>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {event.name}
                </h1>
                {event.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {event.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Año {event.year}
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {event.participants.length} participantes
                  </div>
                  {event.isDrawn && (
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      ✓ Sorteo realizado
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de Deseos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                🎁 Lista de Deseos
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Agrega ideas de regalos que te gustarían recibir
              </p>
            </div>
            <WishList eventId={eventId} canEdit={true} />
          </div>

          {/* Mensajes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                💬 Mensajes
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Envía mensajes anónimos a otros participantes
              </p>
            </div>
            <MessageChat eventId={eventId} />
          </div>
        </div>
      </div>
    </div>
  )
}
