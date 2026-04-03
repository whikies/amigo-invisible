import { auth } from '@/auth'
import { redirect } from 'next/navigation'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export async function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const session = await auth()

  // Si no hay sesión, redirigir a login
  if (!session?.user) {
    redirect('/login')
  }

  // Si requiere admin y no es admin, redirigir a home
  if (requireAdmin && session.user.role !== 'admin') {
    redirect('/')
  }

  return <>{children}</>
}
