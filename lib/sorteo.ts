import { prisma } from '@/lib/prisma'
import { encryptAssignment } from '@/lib/encryption'

type EventParticipantWithUser = {
  id: number
  eventId: number
  userId: number
  createdAt: Date
  user: {
    id: number
    email: string
    name: string
    password: string
    role: string
    emailVerified: Date | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  }
}

/**
 * Algoritmo de sorteo de amigo invisible considerando exclusiones
 * Usa el algoritmo de Fisher-Yates con validación de restricciones
 */
async function performDraw(
  eventId: number
): Promise<{ success: boolean; error?: string; assignments?: number }> {
  // 1. Obtener participantes del evento
  const participants = await prisma.eventParticipant.findMany({
    where: { eventId },
    include: {
      user: true
    }
  })

  if (participants.length < 3) {
    return { success: false, error: 'Se necesitan al menos 3 participantes para el sorteo' }
  }

  // 2. Obtener exclusiones relevantes
  const participantUserIds = participants.map(p => p.userId)
  const exclusions = await prisma.userExclusion.findMany({
    where: {
      OR: [
        { userId: { in: participantUserIds } },
        { excludedUserId: { in: participantUserIds } }
      ]
    }
  })

  // Crear mapa de exclusiones bidireccional
  const exclusionMap = new Map<number, Set<number>>()
  exclusions.forEach(exc => {
    if (!exclusionMap.has(exc.userId)) {
      exclusionMap.set(exc.userId, new Set())
    }
    if (!exclusionMap.has(exc.excludedUserId)) {
      exclusionMap.set(exc.excludedUserId, new Set())
    }
    exclusionMap.get(exc.userId)!.add(exc.excludedUserId)
    exclusionMap.get(exc.excludedUserId)!.add(exc.userId)
  })

  // 3. Intentar generar asignación válida (máximo 1000 intentos)
  let assignments: Map<number, number> | null = null
  const maxAttempts = 1000

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = tryGenerateAssignments(participants, exclusionMap)
    if (result) {
      assignments = result
      break
    }
  }

  if (!assignments) {
    return {
      success: false,
      error: 'No se pudo generar un sorteo válido con las exclusiones actuales. Intenta reducir las exclusiones.'
    }
  }

  // 4. Cifrar y guardar asignaciones
  const assignmentsData: Array<{
    eventId: number
    userId: number
    encryptedAssignedTo: string
    iv: string
    salt: string
    authTag: string
  }> = []

  for (const [giverId, receiverId] of assignments.entries()) {
    const giver = participants.find(p => p.userId === giverId)!
    const receiver = participants.find(p => p.userId === receiverId)!

    // Cifrar la asignación con la contraseña del que da el regalo
    const encrypted = await encryptAssignment(
      receiver.userId,
      giver.user.password  // Usamos el hash bcrypt como "contraseña base"
    )

    assignmentsData.push({
      eventId,
      userId: giverId,
      encryptedAssignedTo: encrypted.encryptedData,
      iv: encrypted.iv,
      salt: encrypted.salt,
      authTag: encrypted.authTag
    })
  }

  // Guardar todas las asignaciones en una transacción
  await prisma.$transaction([
    // Primero eliminar asignaciones previas si existen
    prisma.assignment.deleteMany({
      where: { eventId }
    }),
    // Crear las nuevas asignaciones
    prisma.assignment.createMany({
      data: assignmentsData
    }),
    // Marcar el evento como sorteado
    prisma.event.update({
      where: { id: eventId },
      data: { isDrawn: true }
    })
  ])

  return { success: true, assignments: assignmentsData.length }
}

/**
 * Intenta generar un conjunto válido de asignaciones
 * Retorna null si no es posible con la configuración actual
 */
function tryGenerateAssignments(
  participants: EventParticipantWithUser[],
  exclusionMap: Map<number, Set<number>>
): Map<number, number> | null {
  const userIds = participants.map(p => p.userId)
  const n = userIds.length

  // Crear array de receptores y shufflearlo
  const receivers = [...userIds]
  shuffleArray(receivers)

  // Intentar asignar cada persona
  const assignments = new Map<number, number>()

  for (let i = 0; i < n; i++) {
    const giver = userIds[i]
    const receiver = receivers[i]

    // Verificar restricciones:
    // 1. No puede asignarse a sí mismo
    if (giver === receiver) {
      return null
    }

    // 2. No puede estar en la lista de exclusiones
    const exclusions = exclusionMap.get(giver)
    if (exclusions && exclusions.has(receiver)) {
      return null
    }

    assignments.set(giver, receiver)
  }

  return assignments
}

/**
 * Fisher-Yates shuffle para aleatorizar array
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

/**
 * Verifica si un sorteo es posible dado el grafo de exclusiones
 * Usa teoría de grafos: necesitamos un ciclo hamiltoniano en el grafo complementario
 */
export function canPerformDraw(
  participantCount: number,
  exclusions: Array<{ userId: number; excludedUserId: number }>
): boolean {
  // Casos base
  if (participantCount < 3) return false
  if (exclusions.length === 0) return true

  // Si hay demasiadas exclusiones, es probable que no sea posible
  // Un grafo completo tiene n*(n-1)/2 aristas
  // Para que exista un ciclo hamiltoniano necesitamos suficiente conectividad
  const maxExclusions = Math.floor((participantCount * (participantCount - 1)) / 4)

  return exclusions.length <= maxExclusions
}

export { performDraw }
