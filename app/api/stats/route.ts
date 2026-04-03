import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// Obtener estadísticas del sistema
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const userId = parseInt(session.user.id)
    const isAdmin = session.user.role === 'admin'

    // Estadísticas personales del usuario
    const userStats = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        events: {
          include: {
            event: true
          }
        },
        assignments: {
          include: {
            event: true
          }
        },
        exclusionsFrom: {
          include: {
            excludedUser: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!userStats) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Calcular estadísticas personales
    const activeEvents = userStats.events.filter(e => e.event.isActive)
    const drawnEvents = userStats.events.filter(e => e.event.isDrawn)

    const personalStats = {
      totalEvents: userStats.events.length,
      activeEvents: activeEvents.length,
      drawnEvents: drawnEvents.length,
      assignments: userStats.assignments.length,
      exclusions: userStats.exclusionsFrom.length,
      upcomingEvents: activeEvents
        .filter(e => e.event.eventDate && new Date(e.event.eventDate) > new Date())
        .sort((a, b) => {
          const dateA = a.event.eventDate ? new Date(a.event.eventDate).getTime() : 0
          const dateB = b.event.eventDate ? new Date(b.event.eventDate).getTime() : 0
          return dateA - dateB
        })
        .slice(0, 3)
        .map(e => ({
          id: e.event.id,
          name: e.event.name,
          eventDate: e.event.eventDate,
          isDrawn: e.event.isDrawn
        }))
    }

    // Si es admin, obtener estadísticas globales
    let adminStats = null

    if (isAdmin) {
      const [
        totalUsers,
        activeUsers,
        totalEvents,
        activeEventsCount,
        drawnEventsCount,
        totalAssignments,
        totalExclusions,
        recentUsers,
        recentEvents
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.event.count(),
        prisma.event.count({ where: { isActive: true } }),
        prisma.event.count({ where: { isDrawn: true } }),
        prisma.assignment.count(),
        prisma.userExclusion.count(),
        prisma.user.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            role: true
          }
        }),
        prisma.event.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                participants: true,
                assignments: true
              }
            }
          }
        })
      ])

      // Calcular participación promedio
      const eventsWithParticipants = await prisma.event.findMany({
        include: {
          _count: {
            select: {
              participants: true
            }
          }
        }
      })

      const avgParticipation = eventsWithParticipants.length > 0
        ? eventsWithParticipants.reduce((sum, e) => sum + e._count.participants, 0) / eventsWithParticipants.length
        : 0

      adminStats = {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          admins: await prisma.user.count({ where: { role: 'admin' } })
        },
        events: {
          total: totalEvents,
          active: activeEventsCount,
          drawn: drawnEventsCount,
          pending: totalEvents - drawnEventsCount
        },
        assignments: {
          total: totalAssignments
        },
        exclusions: {
          total: totalExclusions
        },
        participation: {
          average: Math.round(avgParticipation * 10) / 10
        },
        recent: {
          users: recentUsers,
          events: recentEvents.map(e => ({
            id: e.id,
            name: e.name,
            year: e.year,
            isActive: e.isActive,
            isDrawn: e.isDrawn,
            participantCount: e._count.participants,
            assignmentCount: e._count.assignments,
            createdAt: e.createdAt
          }))
        }
      }
    }

    return NextResponse.json({
      success: true,
      personal: personalStats,
      admin: adminStats
    })

  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    return NextResponse.json(
      { error: 'Error interno al obtener estadísticas' },
      { status: 500 }
    )
  }
}
