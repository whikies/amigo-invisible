import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

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

          if (!twoFactorToken) {
            // Credenciales correctas pero falta 2FA
            throw new Error('2FA_REQUIRED')
          }

          // Verificar el código 2FA
          if (!user.twoFactorSecret) {
            throw new Error('2FA_NOT_CONFIGURED')
          }

          // Descifrar y verificar el token
          const crypto = await import('crypto')
          const speakeasy = await import('speakeasy')

          try {
            const [encrypted, ivHex, authTagHex] = user.twoFactorSecret.split(':')
            const key = crypto.scryptSync(process.env.AUTH_SECRET || '', 'salt', 32)
            const iv = Buffer.from(ivHex, 'hex')
            const authTag = Buffer.from(authTagHex, 'hex')

            const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
            decipher.setAuthTag(authTag)

            let decrypted = decipher.update(encrypted, 'hex', 'utf8')
            decrypted += decipher.final('utf8')

            const verified = speakeasy.totp.verify({
              secret: decrypted,
              encoding: 'base32',
              token: twoFactorToken,
              window: 2
            })

            if (!verified) {
              throw new Error('INVALID_2FA_TOKEN')
            }
          } catch (error) {
            console.error('2FA verification error:', error)
            throw new Error('INVALID_2FA_TOKEN')
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
