import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export const runtime = 'nodejs'

export default async function ExclusionesPage() {
  // Verificar autenticación
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const exclusions = await prisma.userExclusion.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      excludedUser: true
    }
  })

  // Agrupar exclusiones por parejas (evitar duplicados bidireccionales)
  const groupedExclusions = new Map<string, typeof exclusions[0]>()
  exclusions.forEach(exclusion => {
    const key = [exclusion.userId, exclusion.excludedUserId].sort().join('-')
    if (!groupedExclusions.has(key)) {
      groupedExclusions.set(key, exclusion)
    }
  })

  const uniqueExclusions = Array.from(groupedExclusions.values())

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
            🚫 Exclusiones
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Total: <strong>{uniqueExclusions.length}</strong> relaciones de exclusión (parejas/familia)
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            📝 Un exclusión define qué usuarios NO pueden ser asignados entre sí en el sorteo.
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            ⚠️ Las exclusiones son <strong>bidireccionales</strong>: si A excluye a B, también B excluye a A.
            Aquí se muestran sin duplicados.
          </p>
        </div>

        {/* Exclusions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {uniqueExclusions.map((exclusion) => (
            <div
              key={exclusion.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border-2 border-gray-100 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600 transition-all"
            >
              {/* Exclusion Visual */}
              <div className="flex items-center justify-between gap-4">
                {/* User 1 */}
                <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Usuario</div>
                  <div className="font-bold text-gray-800 dark:text-gray-100">
                    {exclusion.user.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    ID: {exclusion.user.id}
                  </div>
                </div>

                {/* Separator */}
                <div className="flex flex-col items-center">
                  <div className="text-3xl">🚫</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    NO pueden
                  </div>
                </div>

                {/* User 2 */}
                <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Usuario</div>
                  <div className="font-bold text-gray-800 dark:text-gray-100">
                    {exclusion.excludedUser.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    ID: {exclusion.excludedUser.id}
                  </div>
                </div>
              </div>

              {/* Reason Badge */}
              {exclusion.reason && (
                <div className="mt-4 text-center">
                  <span className="inline-block bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1 rounded-full text-xs font-semibold">
                    Motivo: {exclusion.reason}
                  </span>
                </div>
              )}

              {/* Date */}
              <div className="mt-3 text-xs text-gray-400 dark:text-gray-500 text-center">
                Creada: {new Date(exclusion.createdAt).toLocaleDateString('es-ES')}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {uniqueExclusions.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">
              No hay exclusiones definidas.
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 border-2 border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-lg mb-3 text-gray-800 dark:text-gray-100">
            💡 ¿Por qué existen las exclusiones?
          </h3>
          <ul className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
            <li>• <strong>Parejas:</strong> No tiene sentido que regalas a tu pareja en el sorteo</li>
            <li>• <strong>Familia directa:</strong> Padres, hijos, hermanos que viven juntos</li>
            <li>• <strong>Compañeros de piso:</strong> Ya conviven juntos</li>
            <li>• El algoritmo de sorteo <strong>respeta estas restricciones</strong> al asignar</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
