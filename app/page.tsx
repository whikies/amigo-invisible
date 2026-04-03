import Link from 'next/link'
import { auth } from '@/auth'

export default async function Home() {
  const session = await auth()
  const isAdmin = session?.user?.role === 'admin'

  const sections = [
    {
      title: '👥 Usuarios',
      description: 'Lista de todos los usuarios registrados en el sistema',
      href: '/usuarios',
      color: 'from-blue-500 to-blue-600',
      adminOnly: true
    },
    {
      title: '🎄 Eventos',
      description: 'Sorteos de amigo invisible (actual y pasados)',
      href: '/eventos',
      color: 'from-green-500 to-green-600',
      adminOnly: false
    },
    {
      title: '🚫 Exclusiones',
      description: 'Relaciones que no pueden salir en el sorteo (parejas, familia)',
      href: '/exclusiones',
      color: 'from-red-500 to-red-600',
      adminOnly: true
    },
    {
      title: '🎁 Participantes',
      description: 'Usuarios inscritos en cada evento',
      href: '/participantes',
      color: 'from-purple-500 to-purple-600',
      adminOnly: false
    },
    {
      title: '🔐 Asignaciones',
      description: 'Asignaciones CIFRADAS del sorteo (la magia del sistema)',
      href: '/asignaciones',
      color: 'from-yellow-500 to-yellow-600',
      adminOnly: true
    },
  ]

  // Filtrar secciones según rol
  const visibleSections = isAdmin ? sections : sections.filter(s => !s.adminOnly)

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-linear-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            ⭐ Amigo Invisible ⭐
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
            Sistema de sorteo con asignaciones cifradas
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            🔒 Privacidad total: Nadie puede ver las asignaciones sin tu contraseña
          </p>

          {/* Welcome or Login prompt */}
          {session?.user ? (
            <div className="mt-6 inline-block bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg px-6 py-3">
              <p className="text-green-800 dark:text-green-200 font-semibold">
                👋 Bienvenido, {session.user.name}!
              </p>
              {session.user.role === 'admin' && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  👑 Acceso de Administrador
                </p>
              )}
            </div>
          ) : (
            <div className="mt-6 inline-block bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg px-6 py-3">
              <p className="text-yellow-800 dark:text-yellow-200 font-semibold">
                ⚠️ Debes <Link href="/login" className="underline hover:text-yellow-600">iniciar sesión</Link> para acceder a las secciones
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions for logged in users */}
        {session?.user && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* My Events Card */}
            <Link
              href="/mis-eventos"
              className="bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-xl p-6 transition-all hover:scale-105"
            >
              <div className="text-3xl mb-2">🎄</div>
              <h3 className="text-xl font-bold mb-1">Mis Eventos</h3>
              <p className="text-sm text-green-100">
                Inscribirme en sorteos disponibles
              </p>
            </Link>

            {/* My Assignment Card */}
            <Link
              href="/mi-asignacion"
              className="bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl shadow-xl p-6 transition-all hover:scale-105"
            >
              <div className="text-3xl mb-2">🎁</div>
              <h3 className="text-xl font-bold mb-1">Mi Asignación</h3>
              <p className="text-sm text-purple-100">
                Ver a quién le tengo que hacer el regalo
              </p>
            </Link>

            {/* Admin Panel Card */}
            {isAdmin && (
              <Link
                href="/admin/eventos"
                className="bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl shadow-xl p-6 transition-all hover:scale-105"
              >
                <div className="text-3xl mb-2">🎯</div>
                <h3 className="text-xl font-bold mb-1">Panel de Administración</h3>
                <p className="text-sm text-blue-100">
                  Gestionar eventos y realizar sorteos
                </p>
              </Link>
            )}
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {visibleSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="group block"
            >
              <div className="h-full bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border-2 border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600">
                <div className={`inline-block px-4 py-2 rounded-lg bg-linear-to-r ${section.color} text-white mb-4 text-2xl font-bold group-hover:scale-110 transition-transform`}>
                  {section.title}
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {section.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Info Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border-2 border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
            📚 ¿Cómo funciona?
          </h2>
          <div className="space-y-3 text-gray-600 dark:text-gray-300">
            <p>
              <strong className="text-gray-800 dark:text-gray-100">1. Usuarios:</strong> Las personas se registran en el sistema
            </p>
            <p>
              <strong className="text-gray-800 dark:text-gray-100">2. Exclusiones:</strong> Se definen parejas/familiares que no pueden salirse entre sí
            </p>
            <p>
              <strong className="text-gray-800 dark:text-gray-100">3. Evento:</strong> Se crea un sorteo (ej: &quot;Reyes Magos 2026&quot;)
            </p>
            <p>
              <strong className="text-gray-800 dark:text-gray-100">4. Participantes:</strong> Los usuarios se inscriben al evento
            </p>
            <p>
              <strong className="text-gray-800 dark:text-gray-100">5. Sorteo:</strong> El sistema asigna regaladores respetando exclusiones
            </p>
            <p>
              <strong className="text-gray-800 dark:text-gray-100">6. Cifrado:</strong> Cada asignación se cifra con la contraseña del usuario
            </p>
            <p>
              <strong className="text-gray-800 dark:text-gray-100">7. Revelación:</strong> Solo el usuario puede descifrar su asignación
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
