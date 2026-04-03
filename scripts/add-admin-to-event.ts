import { prisma } from '../lib/prisma'

async function addAdminToEvent() {
  try {
    // Obtener admin
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@reyes.com' }
    })

    if (!admin) {
      console.error('❌ Admin no encontrado')
      process.exit(1)
    }

    console.log('👤 Admin encontrado:', admin.email, '- ID:', admin.id)

    // Obtener evento activo
    const evento = await prisma.event.findFirst({
      where: { year: 2026, isActive: true }
    })

    if (!evento) {
      console.error('❌ Evento no encontrado')
      process.exit(1)
    }

    console.log('🎄 Evento encontrado:', evento.name, '- ID:', evento.id)

    // Verificar si ya es participante
    const yaParticipa = await prisma.eventParticipant.findFirst({
      where: {
        eventId: evento.id,
        userId: admin.id
      }
    })

    if (yaParticipa) {
      console.log('✅ Admin ya es participante')
      await prisma.$disconnect()
      return
    }

    // Agregar como participante
    await prisma.eventParticipant.create({
      data: {
        eventId: evento.id,
        userId: admin.id
      }
    })

    console.log('✅ Admin agregado como participante del evento')

    // Verificar
    const totalParticipantes = await prisma.eventParticipant.count({
      where: { eventId: evento.id }
    })

    console.log(`📊 Total participantes ahora: ${totalParticipantes}`)

    await prisma.$disconnect()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

addAdminToEvent()
