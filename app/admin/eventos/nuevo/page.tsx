import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { NuevoEventoForm } from '@/components/NuevoEventoForm'

export const runtime = 'nodejs'

export default async function NuevoEventoPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            ➕ Crear Nuevo Evento
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Define un nuevo sorteo de amigo invisible
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 border-2 border-gray-100 dark:border-gray-700">
          <NuevoEventoForm />
        </div>
      </div>
    </div>
  )
}
