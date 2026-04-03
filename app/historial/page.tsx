import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { HistorialContent } from '@/components/HistorialContent'


export const metadata = {
  title: 'Historial de Eventos - Amigo Invisible',
  description: 'Historial de todos tus eventos de amigo invisible'
}

export default async function HistorialPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              📚 Historial de Eventos
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Todos tus eventos pasados y presentes
            </p>
          </div>

          <Link
            href="/dashboard"
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm font-medium"
          >
            ← Volver
          </Link>
        </div>

        {/* Content */}
        <HistorialContent />
      </div>
    </div>
  )
}
