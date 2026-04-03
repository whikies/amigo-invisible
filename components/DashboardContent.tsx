'use client'

import { useEffect, useState } from 'react'
import { StatCard } from './StatCard'
import { UpcomingEvents } from './UpcomingEvents'
import { QuickAction } from './QuickAction'
import Link from 'next/link'
import { getDashboardStatsAction, type StatsData } from '@/app/actions/stats'

interface DashboardContentProps {
  isAdmin: boolean
}

export function DashboardContent({ isAdmin }: DashboardContentProps) {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchStats() {
      try {
        const result = await getDashboardStatsAction()
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Error al cargar estadísticas')
        }

        setStats(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando estadísticas...</p>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <p className="text-red-700 dark:text-red-300">{error || 'Error al cargar estadísticas'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          ⚡ Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction
            title="Mis Eventos"
            description="Ver e inscribirme en eventos"
            icon="🎄"
            href="/mis-eventos"
            color="green"
          />
          <QuickAction
            title="Mi Asignación"
            description="Ver a quién le regalo"
            icon="🎁"
            href="/mi-asignacion"
            color="purple"
          />
          <QuickAction
            title="Mi Perfil"
            description="Editar mi información"
            icon="👤"
            href="/perfil"
            color="blue"
          />
          {isAdmin && (
            <QuickAction
              title="Panel Admin"
              description="Gestionar el sistema"
              icon="🎯"
              href="/admin/eventos"
              color="yellow"
            />
          )}
        </div>
      </div>

      {/* Personal Stats */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          📊 Mis Estadísticas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Eventos Activos"
            value={stats.personal.activeEvents}
            icon="🎄"
            color="green"
            subtitle="En los que participo"
          />
          <StatCard
            title="Total Eventos"
            value={stats.personal.totalEvents}
            icon="🎯"
            color="blue"
            subtitle="Histórico completo"
          />
          <StatCard
            title="Asignaciones"
            value={stats.personal.assignments}
            icon="🎁"
            color="purple"
            subtitle="Sorteos realizados"
          />
          <StatCard
            title="Exclusiones"
            value={stats.personal.exclusions}
            icon="🚫"
            color="red"
            subtitle="Personas excluidas"
          />
        </div>
      </div>

      {/* Upcoming Events */}
      <UpcomingEvents events={stats.personal.upcomingEvents} />

      {/* Admin Stats */}
      {isAdmin && stats.admin && (
        <>
          <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              👑 Estadísticas del Sistema (Admin)
            </h2>

            {/* Users Stats */}
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Usuarios
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Total Usuarios"
                value={stats.admin.users.total}
                icon="👥"
                color="blue"
              />
              <StatCard
                title="Usuarios Activos"
                value={stats.admin.users.active}
                icon="✅"
                color="green"
              />
              <StatCard
                title="Administradores"
                value={stats.admin.users.admins}
                icon="👑"
                color="yellow"
              />
              <StatCard
                title="Inactivos"
                value={stats.admin.users.inactive}
                icon="⏸️"
                color="red"
              />
            </div>

            {/* Events Stats */}
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Eventos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Total Eventos"
                value={stats.admin.events.total}
                icon="🎯"
                color="blue"
              />
              <StatCard
                title="Eventos Activos"
                value={stats.admin.events.active}
                icon="✅"
                color="green"
              />
              <StatCard
                title="Sorteados"
                value={stats.admin.events.drawn}
                icon="🎲"
                color="purple"
              />
              <StatCard
                title="Pendientes"
                value={stats.admin.events.pending}
                icon="⏳"
                color="yellow"
              />
            </div>

            {/* General Stats */}
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
              General
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <StatCard
                title="Total Asignaciones"
                value={stats.admin.assignments.total}
                icon="🎁"
                color="purple"
              />
              <StatCard
                title="Exclusiones"
                value={stats.admin.exclusions.total}
                icon="🚫"
                color="red"
              />
              <StatCard
                title="Promedio Participantes"
                value={stats.admin.participation.average}
                icon="📊"
                color="pink"
                subtitle="Por evento"
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Users */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-100 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                <span>👥 Usuarios Recientes</span>
                <Link
                  href="/admin/usuarios"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Ver todos →
                </Link>
              </h3>
              <div className="space-y-3">
                {stats.admin.recent.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        user.role === 'admin'
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                          : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      }`}>
                        {user.role === 'admin' ? '👑' : '👤'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Events */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-100 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                <span>🎯 Eventos Recientes</span>
                <Link
                  href="/admin/eventos"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Ver todos →
                </Link>
              </h3>
              <div className="space-y-3">
                {stats.admin.recent.events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/admin/eventos/${event.id}`}
                    className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm flex-1">
                        {event.name}
                      </p>
                      {event.isDrawn && (
                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>👥 {event.participantCount}</span>
                      {event.isDrawn && <span>🎁 {event.assignmentCount}</span>}
                      <span>📅 {event.year}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
