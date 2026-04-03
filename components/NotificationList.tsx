'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import {
  deleteNotificationAction,
  markAllNotificationsAsReadAction,
  markNotificationAsReadAction,
} from '@/app/actions/notifications'

import { useToast } from './ToastProvider'
import { ConfirmDialog } from './ConfirmDialog'

interface Notification {
  id: number
  type: string
  title: string
  message: string
  link: string | null
  isRead: boolean
  createdAt: Date
}

interface NotificationListProps {
  initialNotifications: Notification[]
}

export function NotificationList({ initialNotifications }: NotificationListProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const toast = useToast()

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const result = await markNotificationAsReadAction(notificationId)

      if (result.success) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        )
        router.refresh()
      }
    } catch (error) {
      console.error('Error al marcar notificación:', error)
      toast.error('Error al marcar como leída')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const result = await markAllNotificationsAsReadAction()

      if (result.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        router.refresh()
        toast.success('Todas las notificaciones marcadas como leídas')
      }
    } catch (error) {
      console.error('Error al marcar todas las notificaciones:', error)
      toast.error('Error al marcar todas como leídas')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return

    setLoading(true)
    try {
      const result = await deleteNotificationAction(deleteId)

      if (result.success) {
        setNotifications(prev => prev.filter(n => n.id !== deleteId))
        router.refresh()
        toast.success('Notificación eliminada')
      } else {
        toast.error('Error al eliminar notificación')
      }
    } catch (error) {
      console.error('Error al eliminar notificación:', error)
      toast.error('Error al eliminar notificación')
    } finally {
      setLoading(false)
      setDeleteId(null)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'sorteo':
        return '🎲'
      case 'recordatorio':
        return '⏰'
      case 'invitacion':
        return '📨'
      case 'sistema':
        return 'ℹ️'
      default:
        return '🔔'
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (notifications.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 border-2 border-gray-100 dark:border-gray-700 text-center">
        <div className="text-6xl mb-4">🔔</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          No tienes notificaciones
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Cuando recibas notificaciones, aparecerán aquí
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Ir al Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      {unreadCount > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border-2 border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {unreadCount} notificación{unreadCount > 1 ? 'es' : ''} sin leer
            </span>
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
            >
              Marcar todas como leídas
            </button>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 ${
              !notification.isRead
                ? 'border-blue-200 dark:border-blue-800'
                : 'border-gray-100 dark:border-gray-700'
            } overflow-hidden hover:shadow-xl transition-shadow`}
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {notification.title}
                      {!notification.isRead && (
                        <span className="inline-block w-3 h-3 bg-blue-600 rounded-full"></span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Marcar leída
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteId(notification.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(notification.createdAt)}
                    </span>
                    {notification.link && (
                      <Link
                        href={notification.link}
                        onClick={() => {
                          if (!notification.isRead) {
                            handleMarkAsRead(notification.id)
                          }
                        }}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                      >
                        Ver detalles →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Notificación"
        message="¿Estás seguro de que deseas eliminar esta notificación? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        loading={loading}
      />
    </div>
  )
}
