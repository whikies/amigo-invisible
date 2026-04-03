import { prisma } from '../lib/prisma'

async function checkAdminParticipation() {
  try {
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@reyes.com' }
    })
    console.log('👤 Admin user:', adminUser?.email, '- ID:', adminUser?.id)

    const evento = await prisma.event.findFirst({
      where: { year: 2026, isActive: true }
    })
    console.log('\n🎄 Evento:', evento?.name, '- ID:', evento?.id)

    if (!evento) {
      console.error('Evento no encontrado')
      process.exit(1)
    }

    const participantes = await prisma.eventParticipant.findMany({
      where: { eventId: evento.id },
      include: { user: { select: { id: true, email: true, name: true } } }
    })
    console.log('\n👥 Total participantes:', participantes.length)

    const adminParticipa = participantes.find(p => p.user.email === 'admin@reyes.com')
    console.log('🔍 Admin participa?', adminParticipa ? '✅ SÍ' : '❌ NO')

    if (adminParticipa) {
      console.log('   - EventParticipant ID:', adminParticipa.id)
    }

    const asignaciones = await prisma.assignment.findMany({
      where: { eventId: evento.id },
      include: { user: { select: { id: true, email: true } } }
    })
    console.log('\n🎁 Total asignaciones:', asignaciones.length)

    const adminAsignacion = asignaciones.find(a => a.user.email === 'admin@reyes.com')
    console.log('🔍 Admin tiene asignación?', adminAsignacion ? '✅ SÍ' : '❌ NO')

    if (adminAsignacion) {
      console.log('   - Assignment ID:', adminAsignacion.id)
      console.log('   - Encrypted:', adminAsignacion.encryptedAssignedTo.substring(0, 20) + '...')
    }

    // Mostrar todas las asignaciones
    console.log('\n📋 Todas las asignaciones:')
    asignaciones.forEach(a => {
      console.log(`   - ${a.user.email} (ID: ${a.userId})`)
    })

    await prisma.$disconnect()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

checkAdminParticipation()
