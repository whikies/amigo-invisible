import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { DashboardContent } from '@/components/DashboardContent'

export const runtime = 'nodejs'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const isAdmin = session.user.role === 'admin'

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            📊 Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bienvenido, <strong>{session.user.name || session.user.email}</strong>
            {isAdmin && <span className="ml-2 text-yellow-600 dark:text-yellow-400">👑 Admin</span>}
          </p>
        </div>

        {/* Dashboard Content */}
        <DashboardContent isAdmin={isAdmin} />
      </div>
    </div>
  )
}
