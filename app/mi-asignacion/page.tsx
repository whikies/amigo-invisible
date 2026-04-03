import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { DecryptAssignment } from '@/components/DecryptAssignment'

export const runtime = 'nodejs'

export default async function MiAsignacionPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const userId = parseInt(session.user.id)

  // Obtener todos los eventos activos donde el usuario participa
  const participaciones = await prisma.eventParticipant.findMany({
    where: {
      userId,
      event: {
        isActive: true,
        isDrawn: true
      }
    },
    include: {
      event: true
    },
    orderBy: {
      event: {
        createdAt: 'desc'
      }
    }
  })

  // Obtener las asignaciones del usuario
  const asignaciones = await prisma.assignment.findMany({
    where: {
      userId,
      event: {
        isActive: true
      }
    },
    include: {
      event: true
    }
  })

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🎁 Mi Asignación
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Aquí puedes ver a quién le tienes que hacer el regalo
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-6 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                ¿Cómo funciona?
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li>• Tu asignación está cifrada por seguridad</li>
                <li>• Necesitas tu contraseña para descifrarla</li>
                <li>• Nadie más puede ver a quién te tocó, ni siquiera los administradores</li>
                <li>• Solo tú puedes ver esta información con tu contraseña</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Asignaciones */}
        {asignaciones.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-12 text-center border-2 border-gray-100 dark:border-gray-700">
            <div className="text-6xl mb-4">🎄</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No tienes asignaciones aún
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {participaciones.length === 0
                ? 'No estás participando en ningún evento activo.'
                : 'El sorteo aún no se ha realizado para tus eventos.'
              }
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-linear-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all font-semibold"
            >
              Volver al inicio
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {asignaciones.map((asignacion) => (
              <div
                key={asignacion.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 border-2 border-gray-100 dark:border-gray-700"
              >
                {/* Event Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {asignacion.event.name}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Año {asignacion.event.year} • Evento: {asignacion.event.eventDate ? new Date(asignacion.event.eventDate).toLocaleDateString('es-ES') : 'Fecha por confirmar'}
                    </p>
                  </div>
                  <span className="px-4 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-semibold">
                    ✓ Activo
                  </span>
                </div>

                {/* Decrypt Component */}
                <DecryptAssignment
                  eventId={asignacion.eventId}
                  encryptedData={{
                    encrypted: asignacion.encryptedAssignedTo,
                    iv: asignacion.iv,
                    salt: asignacion.salt,
                    authTag: asignacion.authTag
                  }}
                />
              </div>
            ))}
          </div>
        )}

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
