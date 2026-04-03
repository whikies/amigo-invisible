import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { InvitationManager } from '@/components/InvitationManager'
import Link from 'next/link'

export default async function InvitationsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
          >
            ← Volver al Dashboard
          </Link>
        </div>

        {/* Componente principal */}
        <InvitationManager />
      </div>
    </div>
  )
}
