import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ExclusionManager } from '@/components/ExclusionManager'

export const runtime = 'nodejs'

export default async function AdminExclusionesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'admin') {
    redirect('/')
  }

  // Obtener todas las exclusiones
  const exclusiones = await prisma.userExclusion.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      excludedUser: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: [
      {
        user: {
          name: 'asc'
        }
      },
      {
        excludedUser: {
          name: 'asc'
        }
      }
    ]
  })

  // Obtener todos los usuarios activos
  const usuarios = await prisma.user.findMany({
    where: {
      isActive: true
    },
    select: {
      id: true,
      name: true,
      email: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  // Agrupar exclusiones por pares únicos (evitar duplicados bidireccionales)
  const exclusionesPares = new Map<string, typeof exclusiones[0]>()

  exclusiones.forEach(exc => {
    const key = [exc.userId, exc.excludedUserId].sort().join('-')
    if (!exclusionesPares.has(key)) {
      exclusionesPares.set(key, exc)
    }
  })

  const exclusionesUnicas = Array.from(exclusionesPares.values())
  const totalParejas = exclusionesUnicas.length

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                🚫 Gestión de Exclusiones
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Define parejas o familiares que no pueden salirse en el sorteo
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-gray-100 dark:border-gray-700">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                {totalParejas}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                Parejas con Exclusión
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-gray-100 dark:border-gray-700">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {usuarios.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                Usuarios Activos
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-gray-100 dark:border-gray-700">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {exclusiones.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                Registros Totales (bidireccional)
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-6 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                ¿Qué son las exclusiones?
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li>• Las exclusiones definen pares de personas que no pueden ser asignadas entre sí</li>
                <li>• Úsalas para parejas, hermanos, o personas que ya intercambian regalos</li>
                <li>• Las exclusiones son bidireccionales: si A excluye a B, entonces B también excluye a A</li>
                <li>• El algoritmo de sorteo respeta automáticamente estas restricciones</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Exclusion Manager Component */}
        <ExclusionManager
          exclusionesIniciales={exclusionesUnicas}
          usuarios={usuarios}
        />

        {/* Back Link */}
        <div className="mt-8 flex justify-between items-center">
          <Link
            href="/admin/eventos"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            ← Volver a Panel Admin
          </Link>
          <Link
            href="/"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Inicio →
          </Link>
        </div>
      </div>
    </div>
  )
}
