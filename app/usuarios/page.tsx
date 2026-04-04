import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export const runtime = 'nodejs'

export default async function UsuariosPage() {
  // Verificar autenticación
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          exclusionsFrom: true,
          assignments: true,
          events: true
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
            👥 Usuarios
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Total: <strong>{users.length}</strong> usuarios registrados
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Cada usuario puede participar en múltiples eventos y tener exclusiones con otros usuarios.
          </p>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border-2 border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all"
            >
              {/* User Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                    {user.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 break-all">
                    {user.email}
                  </p>
                </div>
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs font-semibold">
                  ID: {user.id}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Exclusiones</div>
                  <div className="text-lg font-bold text-red-600 dark:text-red-400">
                    {user._count.exclusionsFrom}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Eventos</div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {user._count.events}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Asignaciones</div>
                  <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                    {user._count.assignments}
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                Registrado: {new Date(user.createdAt).toLocaleDateString('es-ES')}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {users.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">
              No hay usuarios registrados.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
