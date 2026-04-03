import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { EditEventoForm } from '@/components/EditEventoForm'
import Link from 'next/link'

export const runtime = 'nodejs'

export default async function EditarEventoPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'admin') {
    redirect('/')
  }

  const { id } = await params
  const eventId = parseInt(id)

  if (isNaN(eventId)) {
    notFound()
  }

  // Obtener evento
  const evento = await prisma.event.findUnique({
    where: { id: eventId }
  })

  if (!evento) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href={`/admin/eventos/${evento.id}`}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              ← Volver al evento
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            ✏️ Editar Evento
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Modifica la información del evento: {evento.name}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 border-2 border-gray-100 dark:border-gray-700">
          <EditEventoForm event={{
            id: evento.id,
            name: evento.name,
            description: evento.description,
            year: evento.year,
            eventDate: evento.eventDate,
            drawDate: evento.drawDate,
            isActive: evento.isActive,
            isDrawn: evento.isDrawn
          }} />
        </div>
      </div>
    </div>
  )
}
