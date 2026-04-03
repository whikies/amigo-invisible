import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ProfileEditor } from '@/components/ProfileEditor'

export const runtime = 'nodejs'

export default async function PerfilPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // Obtener datos completos del usuario
  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    include: {
      events: {
        include: {
          event: {
            select: {
              id: true,
              name: true,
              eventDate: true,
              isActive: true
            }
          }
        }
      },
      assignments: {
        include: {
          event: {
            select: {
              name: true,
              eventDate: true
            }
          }
        }
      }
    }
  })

  if (!user) {
    redirect('/login')
  }

  // Calcular estadísticas
  const stats = {
    eventosParticipando: user.events.filter((p) => p.event.isActive).length,
    totalEventos: user.events.length,
    asignacionesRecibidas: user.assignments.length
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            👤 Mi Perfil
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona tu información personal y configuración
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Eventos Activos</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.eventosParticipando}
                </p>
              </div>
              <span className="text-4xl">🎄</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Eventos</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.totalEventos}
                </p>
              </div>
              <span className="text-4xl">🎯</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Asignaciones</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.asignacionesRecibidas}
                </p>
              </div>
              <span className="text-4xl">🎁</span>
            </div>
          </div>
        </div>

        {/* Editor de Perfil */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <ProfileEditor user={user} />
        </div>

        {/* Información adicional */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            ℹ️ Información de cuenta
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p><strong>Rol:</strong> {user.role === 'admin' ? '🔑 Administrador' : '👤 Usuario'}</p>
            <p><strong>Estado:</strong> {user.isActive ? '✅ Activo' : '⏸️ Inactivo'}</p>
            <p><strong>Miembro desde:</strong> {new Date(user.createdAt).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
