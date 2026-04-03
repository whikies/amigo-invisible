import { auth } from '@/auth'
import { UserMenu } from './UserMenu'
import { ImpersonationBanner } from './ImpersonationBanner'
import { NotificationBell } from './NotificationBell'
import { MobileMenu } from './MobileMenu'
import Link from 'next/link'

export async function Header() {
  const session = await auth()
  const isImpersonating = session?.user?.impersonatedBy

  return (
    <>
      {/* Impersonation Banner */}
      {isImpersonating && session?.user && (
        <ImpersonationBanner
          userName={session.user.name || session.user.email || 'Usuario'}
          adminId={`${session.user.impersonatedBy}`}
        />
      )}

      <header className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            <span className="text-xl font-bold bg-linear-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Reyes Magos
            </span>
          </Link>

          {/* Navigation Menu (logged in users) */}
          {session?.user && (
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                📊 Dashboard
              </Link>
              {session.user.role === 'admin' && (
                <>
                  <Link
                    href="/admin/eventos"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    🎯 Eventos
                  </Link>
                  <Link
                    href="/admin/usuarios"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    👥 Usuarios
                  </Link>
                  <Link
                    href="/admin/exclusiones"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    🚫 Exclusiones
                  </Link>
                </>
              )}
              <Link
                href="/mis-eventos"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              >
                🎄 Mis Eventos
              </Link>
              <Link
                href="/mi-asignacion"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                🎁 Mi Asignación
              </Link>
              <Link
                href="/historial"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              >
                📚 Historial
              </Link>
              <Link
                href="/invitaciones"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
              >
                ✉ Invitaciones
              </Link>
            </nav>
          )}

          {/* User Menu o Login */}
          <div className="flex items-center gap-2">
            {session?.user ? (
              <>
                <MobileMenu isAdmin={session.user.role === 'admin'} />
                <NotificationBell />
                <UserMenu user={session.user} />
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-linear-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all font-semibold text-sm"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
    </>
  )
}
