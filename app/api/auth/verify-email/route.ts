import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

/**
 * GET /api/auth/verify-email?token=xxx
 * Verifica el email del usuario usando un token
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url))
    }

    // Buscar token válido
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!verificationToken) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url))
    }

    // Verificar que no haya expirado
    if (new Date() > verificationToken.expiresAt) {
      // Eliminar token expirado
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id }
      })
      return NextResponse.redirect(new URL('/login?error=expired_token', request.url))
    }

    // Verificar email del usuario
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: new Date() }
      }),
      prisma.verificationToken.delete({
        where: { id: verificationToken.id }
      })
    ])

    // Redirigir al login con mensaje de éxito
    return NextResponse.redirect(new URL('/login?verified=true', request.url))
  } catch (error) {
    console.error('Error en verify-email:', error)
    return NextResponse.redirect(new URL('/login?error=verification_failed', request.url))
  }
}
