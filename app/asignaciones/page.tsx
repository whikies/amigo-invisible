import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export const runtime = 'nodejs'

export default async function AsignacionesPage() {
  // Verificar autenticación
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const assignments = await prisma.assignment.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      event: true
    }
  })

  // Agrupar por evento
  const assignmentsByEvent = assignments.reduce((acc, assignment) => {
    const eventId = assignment.event.id
    if (!acc[eventId]) {
      acc[eventId] = {
        event: assignment.event,
        assignments: []
      }
    }
    acc[eventId].assignments.push(assignment)
    return acc
  }, {} as Record<number, { event: typeof assignments[0]['event'], assignments: typeof assignments }>)

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
            🔐 Asignaciones Cifradas
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Total: <strong>{assignments.length}</strong> asignaciones en el sistema
          </p>
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🔒</div>
            <div>
              <h3 className="font-bold text-lg text-yellow-900 dark:text-yellow-100 mb-2">
                ⚠️ Sistema de Máxima Seguridad
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                <strong>📝 Modelo Assignment:</strong> Las asignaciones están <strong>cifradas con AES-256-GCM</strong>.
                Solo el usuario con su contraseña puede descifrar a quién le toca regalar.
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                🚫 Ni siquiera el administrador de la base de datos puede ver las asignaciones.
                El campo <code>encryptedAssignedTo</code> contiene datos ilegibles sin la contraseña correcta.
              </p>
            </div>
          </div>
        </div>

        {/* Assignments by Event */}
        <div className="space-y-8">
          {Object.values(assignmentsByEvent).map(({ event, assignments: eventAssignments }) => (
            <div
              key={event.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              {/* Event Header */}
              <div className="bg-linear-to-r from-yellow-500 to-yellow-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{event.name}</h2>
                    <p className="text-yellow-100">
                      {event.isDrawn ? '✓ Sorteo realizado' : '⏳ Sorteo pendiente'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{eventAssignments.length}</div>
                    <div className="text-sm text-yellow-100">asignaciones</div>
                  </div>
                </div>
              </div>

              {/* Assignments List */}
              <div className="p-6">
                <div className="space-y-4">
                  {eventAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors border border-gray-200 dark:border-gray-600"
                    >
                      {/* User Info */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-yellow-200 dark:bg-yellow-800 flex items-center justify-center font-bold text-yellow-800 dark:text-yellow-200 text-lg">
                            {assignment.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 dark:text-gray-100">
                              {assignment.user.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {assignment.user.email}
                            </div>
                          </div>
                        </div>
                        <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded text-xs font-mono">
                          ID: {assignment.id}
                        </span>
                      </div>

                      {/* Encrypted Data */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Encrypted Assignment */}
                          <div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                              🔐 Asignación Cifrada
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-900 rounded p-2 font-mono text-xs text-gray-600 dark:text-gray-400 break-all">
                              {assignment.encryptedAssignedTo.substring(0, 32)}...
                            </div>
                          </div>

                          {/* IV */}
                          <div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                              🔑 Vector IV
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-900 rounded p-2 font-mono text-xs text-gray-600 dark:text-gray-400 break-all">
                              {assignment.iv.substring(0, 32)}...
                            </div>
                          </div>

                          {/* Salt */}
                          <div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                              🧂 Salt
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-900 rounded p-2 font-mono text-xs text-gray-600 dark:text-gray-400 break-all">
                              {assignment.salt.substring(0, 32)}...
                            </div>
                          </div>

                          {/* Auth Tag */}
                          <div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                              ✓ Auth Tag (GCM)
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-900 rounded p-2 font-mono text-xs text-gray-600 dark:text-gray-400 break-all">
                              {assignment.authTag.substring(0, 32)}...
                            </div>
                          </div>
                        </div>

                        {/* Explanation */}
                        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 rounded p-2">
                          ℹ️ <strong>Solo {assignment.user.name}</strong> puede descifrar esta asignación con su contraseña.
                        </div>
                      </div>

                      {/* Date */}
                      <div className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                        Creada: {new Date(assignment.createdAt).toLocaleDateString('es-ES')} a las {new Date(assignment.createdAt).toLocaleTimeString('es-ES')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {assignments.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              No hay asignaciones creadas aún.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Las asignaciones se crean cuando se realiza el sorteo de un evento.
            </p>
          </div>
        )}

        {/* Technical Details */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 border-2 border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-100">
            🔐 Detalles Técnicos del Cifrado
          </h3>

          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
            <div>
              <strong className="text-gray-800 dark:text-gray-100">Algoritmo:</strong> AES-256-GCM
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                Cifrado simétrico de grado militar con autenticación
              </p>
            </div>

            <div>
              <strong className="text-gray-800 dark:text-gray-100">Derivación de clave:</strong> PBKDF2 (100,000 iteraciones)
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                La contraseña del usuario se convierte en una clave de 256 bits usando el salt único
              </p>
            </div>

            <div>
              <strong className="text-gray-800 dark:text-gray-100">Componentes:</strong>
              <ul className="text-xs text-gray-500 dark:text-gray-400 ml-4 mt-1 space-y-1">
                <li>• <code>encryptedAssignedTo</code>: ID del usuario asignado (cifrado)</li>
                <li>• <code>iv</code>: Vector de inicialización único (16 bytes)</li>
                <li>• <code>salt</code>: Salt único para derivar la clave (32 bytes)</li>
                <li>• <code>authTag</code>: Tag de autenticación GCM (detecta manipulaciones)</li>
              </ul>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded p-3 border border-green-200 dark:border-green-800">
              <strong className="text-green-800 dark:text-green-200">✓ Garantías de seguridad:</strong>
              <ul className="text-xs text-gray-600 dark:text-gray-300 mt-2 space-y-1">
                <li>✓ Confidencialidad total (nadie puede ver sin la contraseña)</li>
                <li>✓ Integridad verificada (authTag detecta manipulaciones)</li>
                <li>✓ Sin backdoors (no hay forma de recuperar sin contraseña)</li>
                <li>✓ Forward secrecy (cada asignación con salt e IV únicos)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
