import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { UserManager } from '@/components/UserManager'

export const runtime = 'nodejs'

export default async function AdminUsuariosPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'admin') {
    redirect('/')
  }

  // Obtener todos los usuarios
  const usuarios = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          events: true,
          assignments: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const totalUsuarios = usuarios.length
  const usuariosActivos = usuarios.filter(u => u.isActive).length
  const administradores = usuarios.filter(u => u.role === 'admin').length

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                👥 Gestión de Usuarios
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Administra usuarios, roles y permisos del sistema
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-gray-100 dark:border-gray-700">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {totalUsuarios}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                Total Usuarios
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-gray-100 dark:border-gray-700">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                {usuariosActivos}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                Usuarios Activos
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-gray-100 dark:border-gray-700">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {administradores}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                Administradores
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-gray-100 dark:border-gray-700">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                {totalUsuarios - usuariosActivos}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                Inactivos
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-6 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                Gestión de Usuarios
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li>• Crea nuevos usuarios manualmente o permite el auto-registro</li>
                <li>• Asigna roles: <strong>admin</strong> (acceso total) o <strong>user</strong> (usuario regular)</li>
                <li>• Desactiva usuarios temporalmente sin eliminar su información</li>
                <li>• Los usuarios inactivos no pueden iniciar sesión ni participar en eventos</li>
              </ul>
            </div>
          </div>
        </div>

        {/* User Manager Component */}
        <UserManager usuarios={usuarios} currentUserId={parseInt(session.user.id)} />

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
