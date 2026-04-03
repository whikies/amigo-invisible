import { PrismaClient } from '@/app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const connectionString = `${process.env.DATABASE_URL}`
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function testLogin() {
  console.log('🔍 Testing login for admin@reyes.com...\n')

  // Buscar usuario
  const user = await prisma.user.findUnique({
    where: { email: 'admin@reyes.com' }
  })

  if (!user) {
    console.log('❌ User not found!')
    process.exit(1)
  }

  console.log('✅ User found:')
  console.log('  - ID:', user.id)
  console.log('  - Email:', user.email)
  console.log('  - Name:', user.name)
  console.log('  - Role:', user.role)
  console.log('  - Active:', user.isActive)
  console.log('  - Password hash:', user.password.substring(0, 20) + '...')
  console.log('')

  // Probar contraseña
  const testPassword = 'admin123'
  const isValid = await bcrypt.compare(testPassword, user.password)

  console.log(`🔐 Testing password "${testPassword}":`, isValid ? '✅ VALID' : '❌ INVALID')

  if (!isValid) {
    console.log('\n❌ Password does not match!')
    console.log('Regenerating with correct password...')

    const newHash = await bcrypt.hash('admin123', 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: newHash }
    })

    console.log('✅ Password updated!')
  }

  await prisma.$disconnect()
}

testLogin()
