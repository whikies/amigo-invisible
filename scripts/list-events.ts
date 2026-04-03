import { prisma } from '../lib/prisma'

async function listEvents() {
  try {
    const eventos = await prisma.event.findMany({
      include: {
        _count: {
          select: {
            participants: true,
            assignments: true
          }
        }
      }
    })

    console.log('🎄 Eventos en la base de datos:\n')

    if (eventos.length === 0) {
      console.log('❌ No hay eventos creados')
    } else {
      eventos.forEach((evento, idx) => {
        console.log(`${idx + 1}. ${evento.name} (ID: ${evento.id})`)
        console.log(`   - Año: ${evento.year}`)
        console.log(`   - Activo: ${evento.isActive ? '✅' : '❌'}`)
        console.log(`   - Sorteado: ${evento.isDrawn ? '✅' : '❌'}`)
        console.log(`   - Participantes: ${evento._count.participants}`)
        console.log(`   - Asignaciones: ${evento._count.assignments}`)
        console.log('')
      })
    }

    await prisma.$disconnect()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

listEvents()
