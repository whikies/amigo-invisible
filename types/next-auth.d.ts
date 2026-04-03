import NextAuth, { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      impersonatedBy?: string | null
      emailVerified?: Date | null
      twoFactorEnabled?: boolean
    } & DefaultSession['user']
  }

  interface User {
    role?: string
    impersonatedBy?: string
    emailVerified?: Date | null
    twoFactorEnabled?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    impersonatedBy?: string | null
    emailVerified?: Date | null
    twoFactorEnabled?: boolean
  }
}
