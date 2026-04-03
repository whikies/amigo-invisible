'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: number
  name: string
  email: string
}

interface Exclusion {
  id: number
  userId: number
  excludedUserId: number
  reason: string | null
  user: User
  excludedUser: User
}

interface ExclusionManagerProps {
  exclusionesIniciales: Exclusion[]
  usuarios: User[]
}

export function ExclusionManager({ exclusionesIniciales, usuarios }: ExclusionManagerProps) {
  const router = useRouter()
  const [showAddModal, setShowAddModal] = useState(false)
  const [user1Id, setUser1Id] = useState<number | null>(null)
  const [user2Id, setUser2Id] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Filtrar usuarios por búsqueda
  const filteredUsers = usuarios.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  async function handleCreateExclusion(e: React.FormEvent) {
    e.preventDefault()

    if (!user1Id || !user2Id) {
      alert('Debes seleccionar 2 usuarios')
      return
    }

    if (user1Id === user2Id) {
      alert('No puedes crear una exclusión de un usuario consigo mismo')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/exclusiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user1Id,
          excludedUserId: user2Id,
          reason: reason || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      alert('✅ Exclusión creada exitosamente')
      setShowAddModal(false)
      setUser1Id(null)
      setUser2Id(null)
      setReason('')
      router.refresh()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteExclusion(exclusionId: number, userName1: string, userName2: string) {
    if (!confirm(`¿Eliminar exclusión entre ${userName1} y ${userName2}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/exclusiones/${exclusionId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      alert('✅ Exclusión eliminada')
      router.refresh()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Add Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-linear-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all font-semibold shadow-lg"
        >
          ➕ Nueva Exclusión
        </button>
      </div>

      {/* Exclusions List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden">
        {exclusionesIniciales.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <div className="text-5xl mb-4">✨</div>
            <p className="text-lg font-semibold mb-2">No hay exclusiones configuradas</p>
            <p className="text-sm">Crea una exclusión para evitar que ciertas personas se salgan en el sorteo</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Usuario 1
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    ↔
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Usuario 2
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Motivo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {exclusionesIniciales.map((exclusion) => (
                  <tr key={exclusion.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-r from-blue-600 to-green-600 flex items-center justify-center text-white font-bold">
                          {exclusion.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {exclusion.user.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {exclusion.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-2xl text-red-500">🚫</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">
                          {exclusion.excludedUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {exclusion.excludedUser.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {exclusion.excludedUser.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {exclusion.reason ? (
                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-semibold">
                          {exclusion.reason}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Sin motivo</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteExclusion(exclusion.id, exclusion.user.name, exclusion.excludedUser.name)}
                        className="px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg text-xs font-semibold transition-colors"
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                ➕ Nueva Exclusión
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Selecciona dos usuarios que no puedan salirse en el sorteo
              </p>
            </div>

            <form onSubmit={handleCreateExclusion} className="p-6 space-y-6">
              {/* Búsqueda */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  🔍 Buscar usuario
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre o email..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                {searchTerm && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {filteredUsers.length} usuario(s) encontrado(s)
                  </p>
                )}
              </div>

              {/* User 1 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Usuario 1
                </label>
                <select
                  value={user1Id || ''}
                  onChange={(e) => setUser1Id(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Seleccionar usuario...</option>
                  {filteredUsers
                    .filter(u => u.id !== user2Id)
                    .map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                </select>
              </div>

              {/* User 2 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Usuario 2
                </label>
                <select
                  value={user2Id || ''}
                  onChange={(e) => setUser2Id(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Seleccionar usuario...</option>
                  {filteredUsers
                    .filter(u => u.id !== user1Id)
                    .map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Motivo (opcional)
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Sin especificar</option>
                  <option value="pareja">Pareja</option>
                  <option value="hermanos">Hermanos</option>
                  <option value="familia">Familia</option>
                  <option value="amigos">Amigos cercanos</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setUser1Id(null)
                    setUser2Id(null)
                    setReason('')
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !user1Id || !user2Id}
                  className="flex-1 px-6 py-3 bg-linear-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? '⏳ Creando...' : '✅ Crear Exclusión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
