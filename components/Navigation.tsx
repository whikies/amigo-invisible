import Link from 'next/link'

export function Navigation() {
  const links = [
    { href: '/', label: '🏠 Inicio' },
    { href: '/usuarios', label: '👥 Usuarios' },
    { href: '/eventos', label: '🎄 Eventos' },
    { href: '/exclusiones', label: '🚫 Exclusiones' },
    { href: '/participantes', label: '🎁 Participantes' },
    { href: '/asignaciones', label: '🔐 Asignaciones' },
  ]

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md mb-8 rounded-lg p-4">
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900 text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-sm font-medium"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
