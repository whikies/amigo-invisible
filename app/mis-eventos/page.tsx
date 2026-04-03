import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { EventoCard } from '@/components/EventoCard'

export const runtime = 'nodejs'

export default async function MisEventosPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const userId = parseInt(session.user.id)

  // Obtener eventos disponibles (activos y aún no sorteados)
  const eventosDisponibles = await prisma.event.findMany({
    where: {
      isActive: true,
      isDrawn: false
    },
    include: {
      _count: {
        select: {
          participants: true
        }
      },
      participants: {
        where: {
          userId
        },
        select: {
          id: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Obtener eventos donde ya estoy participando
  const misParticipaciones = await prisma.eventParticipant.findMany({
    where: {
      userId
    },
    include: {
      event: {
        include: {
          _count: {
            select: {
              participants: true
            }
          }
        }
      }
    },
    orderBy: {
      event: {
        createdAt: 'desc'
      }
    }
  })

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🎄 Mis Eventos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Inscríbete en eventos disponibles o gestiona tus participaciones
          </p>
        </div>

        {/* Eventos donde ya participo */}
        {misParticipaciones.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              📋 Eventos donde participo ({misParticipaciones.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {misParticipaciones.map((participacion) => (
                <EventoCard
                  key={participacion.event.id}
                  evento={participacion.event}
                  participantCount={participacion.event._count.participants}
                  isParticipating={true}
                  userId={userId}
                />
              ))}
            </div>
          </div>
        )}

        {/* Eventos disponibles */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            ✨ Eventos Disponibles
          </h2>

          {eventosDisponibles.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-12 text-center border-2 border-gray-100 dark:border-gray-700">
              <div className="text-6xl mb-4">🎁</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No hay eventos disponibles
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Por el momento no hay eventos abiertos para inscripción.
                {session.user.role === 'admin' && (
                  <>
                    <br />
                    <Link
                      href="/admin/eventos/nuevo"
                      className="inline-block mt-4 px-6 py-3 bg-linear-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all font-semibold"
                    >
                      ➕ Crear Nuevo Evento
                    </Link>
                  </>
                )}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventosDisponibles.map((evento) => {
                const isParticipating = evento.participants.length > 0
                return (
                  <EventoCard
                    key={evento.id}
                    evento={evento}
                    participantCount={evento._count.participants}
                    isParticipating={isParticipating}
                    userId={userId}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                ¿Cómo funciona?
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li>• Inscríbete en los eventos disponibles antes de que se realice el sorteo</li>
                <li>• Una vez inscrito, espera a que el administrador realice el sorteo</li>
                <li>• Después del sorteo, podrás ver tu asignación en &quot;Mi Asignación&quot;</li>
                <li>• Puedes salirte de un evento solo si aún no se ha realizado el sorteo</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
