
import { PrismaPg } from '@prisma/adapter-pg'
import { faker } from '@faker-js/faker'
import bcrypt from 'bcryptjs'
import 'dotenv/config'
import { PrismaClient } from '@/app/generated/prisma/client'

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...')

  // Limpiar datos existentes
  await prisma.assignment.deleteMany()
  await prisma.eventParticipant.deleteMany()
  await prisma.event.deleteMany()
  await prisma.userExclusion.deleteMany()
  await prisma.user.deleteMany()
  console.log('✨ Cleared existing data')

  // Crear usuario admin
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@reyes.com',
      name: 'Administrador',
      password: adminPassword,
      role: 'admin',
      isActive: true
    }
  })
  console.log(`👑 Created admin user: ${admin.email} (password: admin123)`)

  // Crear usuarios de prueba con contraseña "password123"
  const defaultPassword = await bcrypt.hash('password123', 10)
  const users = []

  for (let i = 0; i < 20; i++) {
    users.push({
      email: faker.internet.email().toLowerCase(),
      name: faker.person.fullName(),
      password: defaultPassword,
      role: 'user',
      isActive: true
    })
  }

  // Insertar usuarios
  const createdUsers = await Promise.all(
    users.map(user => prisma.user.create({ data: user }))
  )
  console.log(`✅ Created ${createdUsers.length} users (password: password123)`)

  // Crear exclusiones (parejas que no pueden salir juntas)
  const exclusions = []

  // Simular algunas parejas (2 parejas de ejemplo)
  const couples = [
    [createdUsers[0].id, createdUsers[1].id],
    [createdUsers[2].id, createdUsers[3].id],
    [createdUsers[4].id, createdUsers[5].id],
  ]

  for (const [userId1, userId2] of couples) {
    // Exclusión bidireccional
    await prisma.userExclusion.create({
      data: {
        userId: userId1,
        excludedUserId: userId2,
        reason: 'pareja'
      }
    })
    await prisma.userExclusion.create({
      data: {
        userId: userId2,
        excludedUserId: userId1,
        reason: 'pareja'
      }
    })
    exclusions.push([userId1, userId2])
  }
  console.log(`✅ Created ${exclusions.length * 2} exclusions (${exclusions.length} couples)`)

  // Crear un evento de Reyes Magos 2026
  const event = await prisma.event.create({
    data: {
      name: 'Amigo Invisible Reyes Magos 2026',
      description: 'Sorteo anual de amigo invisible para Reyes',
      year: 2026,
      eventDate: new Date('2026-01-06'),
      isActive: true,
      isDrawn: false,
    }
  })
  console.log(`✅ Created event: ${event.name}`)

  // Añadir participantes al evento (todos los usuarios + admin)
  await prisma.eventParticipant.create({
    data: {
      eventId: event.id,
      userId: admin.id
    }
  })

  for (const user of createdUsers) {
    await prisma.eventParticipant.create({
      data: {
        eventId: event.id,
        userId: user.id
      }
    })
  }
  console.log(`✅ Added ${createdUsers.length + 1} participants to the event (including admin)`)

  console.log('🎉 Seed completed!')
  console.log('\n📊 Summary:')
  console.log(`   - Admin: 1 (admin@reyes.com / admin123)`)
  console.log(`   - Users: ${createdUsers.length} (password123)`)
  console.log(`   - Couples with exclusions: ${exclusions.length}`)
  console.log(`   - Events: 1`)
  console.log(`   - Participants: ${createdUsers.length + 1} (including admin)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
