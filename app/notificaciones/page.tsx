import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { NotificationList } from '@/components/NotificationList'

export const runtime = 'nodejs'

export default async function NotificationsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const userId = parseInt(session.user.id)

  // Obtener todas las notificaciones del usuario
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  })

  // Contar no leídas
  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🔔 Notificaciones
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {unreadCount > 0
              ? `Tienes ${unreadCount} notificación${unreadCount > 1 ? 'es' : ''} sin leer`
              : 'Todas las notificaciones están leídas'}
          </p>
        </div>

        {/* Notifications List */}
        <NotificationList initialNotifications={notifications} />
      </div>
    </div>
  )
}
