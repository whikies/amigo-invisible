'use client'

import { useSession } from 'next-auth/react'
import { EmailVerificationBanner } from './EmailVerificationBanner'

export function ConditionalEmailBanner() {
  const { data: session } = useSession()

  // Solo mostrar si el usuario está autenticado y su email no está verificado
  if (!session?.user?.id || session?.user?.emailVerified) {
    return null
  }

  return <EmailVerificationBanner />
}
