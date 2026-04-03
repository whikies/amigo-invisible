'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

import {
  addParticipantsAction,
  getAvailableUsersAction,
  removeParticipantAction,
} from '@/app/actions/user-management'

interface User {
  id: number
  name: string
  email: string
  isActive: boolean
}

interface Participant {
  id: number
  userId: number
  user: User
}

interface ParticipantManagerProps {
  eventId: number
  participants: Participant[]
}

export function ParticipantManager({ eventId, participants: initialParticipants }: ParticipantManagerProps) {
  const router = useRouter()
  const [showAddModal, setShowAddModal] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchAvailableUsers = useCallback(async () => {
    try {
      const result = await getAvailableUsersAction(eventId)

      if (result.success && result.data) {
        setAvailableUsers(result.data.users)
      }
    } catch {
      console.error('Error fetching users')
    }
  }, [eventId])

  useEffect(() => {
    if (showAddModal) {
      void fetchAvailableUsers()
    }
  }, [showAddModal, fetchAvailableUsers])

  async function handleAddParticipants() {
    if (selectedUsers.size === 0) return

    setLoading(true)
    try {
      const result = await addParticipantsAction({
        eventId,
        userIds: Array.from(selectedUsers),
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      alert(`✅ ${selectedUsers.size} participante(s) agregado(s)`)
      setShowAddModal(false)
      setSelectedUsers(new Set())
      router.refresh()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleRemoveParticipant(participantId: number, userName: string) {
    if (!confirm(`¿Eliminar a ${userName} del evento?`)) {
      return
    }

    try {
      const result = await removeParticipantAction(eventId, participantId)

      if (!result.success) {
        throw new Error(result.error)
      }

      alert(`✅ ${userName} eliminado del evento`)
      router.refresh()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`)
    }
  }

  function toggleUserSelection(userId: number) {
    const newSelection = new Set(selectedUsers)
    if (newSelection.has(userId)) {
      newSelection.delete(userId)
    } else {
      newSelection.add(userId)
    }
    setSelectedUsers(newSelection)
  }

  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      {/* Lista de participantes */}
      {initialParticipants.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No hay participantes aún. Agrega usuarios para comenzar.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {initialParticipants.map((participant) => (
            <div
              key={participant.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-linear-to-r from-blue-600 to-green-600 flex items-center justify-center text-white font-bold">
                  {participant.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                    {participant.user.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {participant.user.email}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleRemoveParticipant(participant.id, participant.user.name)}
                className="ml-2 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Eliminar participante"
              >
                ❌
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Botón agregar */}
      <button
        onClick={() => setShowAddModal(true)}
        className="px-6 py-3 bg-linear-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all font-semibold shadow-lg"
      >
        ➕ Agregar Participantes
      </button>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Agregar Participantes
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Selecciona usuarios para agregar al evento
              </p>
            </div>

            {/* Search */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* User list */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {availableUsers.length === 0
                    ? 'No hay usuarios disponibles para agregar'
                    : 'No se encontraron usuarios'
                  }
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="w-10 h-10 rounded-full bg-linear-to-r from-blue-600 to-green-600 flex items-center justify-center text-white font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          {user.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-4">
              <button
                onClick={handleAddParticipants}
                disabled={loading || selectedUsers.size === 0}
                className="flex-1 px-6 py-3 bg-linear-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Agregando...' : `✅ Agregar ${selectedUsers.size > 0 ? `(${selectedUsers.size})` : ''}`}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedUsers(new Set())
                  setSearchTerm('')
                }}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
