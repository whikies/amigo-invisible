import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { decryptTwoFactorSecret } from '@/lib/two-factor-crypto'

// Tipos extendidos para el usuario
interface ExtendedUser {
  id: string
  email: string
  name: string
  role: string
  emailVerified?: Date | null
  twoFactorEnabled?: boolean
  impersonatedBy?: string
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
        twoFactorToken: { label: '2FA Token', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user || !user.isActive) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        // Si el usuario tiene 2FA habilitado, verificar el token
        if (user.twoFactorEnabled) {
          const twoFactorToken = credentials.twoFactorToken as string | undefined

          // Si falta 2FA, no debería pasar aquí porque ya lo validamos
          // pero si llega, simplemente rechazamos
          if (!twoFactorToken) {
            console.warn('2FA token missing but twoFactorEnabled=true')
            return null
          }

          // Verificar el código 2FA
          if (!user.twoFactorSecret) {
            console.error('2FA enabled but secret not configured')
            return null
          }

          // Descifrar y verificar el token
          const speakeasy = await import('speakeasy')

          try {
            const decrypted = await decryptTwoFactorSecret(user.twoFactorSecret)

            const verified = speakeasy.totp.verify({
              secret: decrypted,
              encoding: 'base32',
              token: twoFactorToken,
              window: 2
            })

            if (!verified) {
              console.warn('2FA token verification failed')
              return null
            }
          } catch (error) {
            console.error('2FA verification error:', error)
            return null
          }
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled || false
        }
      }
    }),
    Credentials({
      id: 'impersonate',
      name: 'Impersonate',
      credentials: {
        userId: { label: 'User ID', type: 'text' },
        adminId: { label: 'Admin ID', type: 'text' },
        token: { label: 'Token', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.userId || !credentials?.adminId || !credentials?.token) {
          return null
        }

        // Verificar que el token es válido (simple check - en producción usar JWT)
        const expectedToken = `impersonate_${credentials.adminId}_${credentials.userId}_${process.env.AUTH_SECRET}`
        if (credentials.token !== expectedToken) {
          return null
        }

        // Verificar que admin existe y es admin
        const admin = await prisma.user.findUnique({
          where: { id: parseInt(credentials.adminId as string) }
        })

        if (!admin || admin.role !== 'admin') {
          return null
        }

        // Obtener usuario a impersonar
        const user = await prisma.user.findUnique({
          where: { id: parseInt(credentials.userId as string) }
        })

        if (!user || !user.isActive) {
          return null
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          impersonatedBy: admin.id.toString(),
          emailVerified: user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled || false
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const extUser = user as ExtendedUser
        token.id = extUser.id
        token.role = extUser.role
        token.impersonatedBy = extUser.impersonatedBy || null
        token.emailVerified = extUser.emailVerified || null
        token.twoFactorEnabled = extUser.twoFactorEnabled || false
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.impersonatedBy = (token.impersonatedBy as string | null) || undefined
        session.user.emailVerified = token.emailVerified as Date | null
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 días
  }
})
