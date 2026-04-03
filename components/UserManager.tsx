'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

import {
  createUserAction,
  deleteUserAction,
  getImpersonationDataAction,
  updateUserAction,
} from '@/app/actions/user-management'

interface User {
  id: number
  email: string
  name: string
  role: string
  isActive: boolean
  emailVerified: Date | null
  createdAt: Date
  _count?: {
    events: number
    assignments: number
  }
}

interface UserManagerProps {
  usuarios: User[]
  currentUserId: number
}

type ModalMode = 'create' | 'edit' | null

export function UserManager({ usuarios, currentUserId }: UserManagerProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'user' | 'admin'>('user')
  const [isActive, setIsActive] = useState(true)

  function openCreateModal() {
    setModalMode('create')
    setName('')
    setEmail('')
    setPassword('')
    setRole('user')
    setIsActive(true)
    setShowModal(true)
  }

  function openEditModal(user: User) {
    setModalMode('edit')
    setSelectedUser(user)
    setName(user.name)
    setEmail(user.email)
    setPassword('')
    setRole(user.role as 'user' | 'admin')
    setIsActive(user.isActive)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setModalMode(null)
    setSelectedUser(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (modalMode === 'create') {
        const result = await createUserAction({ name, email, password, role, isActive })
        if (!result.success) throw new Error(result.error)

        alert('✅ Usuario creado exitosamente')
      } else if (modalMode === 'edit' && selectedUser) {
        const result = await updateUserAction(selectedUser.id, {
          name,
          email,
          ...(password ? { password } : {}),
          role,
          isActive,
        })
        if (!result.success) throw new Error(result.error)

        alert('✅ Usuario actualizado exitosamente')
      }

      closeModal()
      router.refresh()

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      alert(`❌ Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleActive(user: User) {
    if (user.id === currentUserId) {
      alert('❌ No puedes desactivar tu propia cuenta')
      return
    }

    const action = user.isActive ? 'desactivar' : 'activar'
    if (!confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} a ${user.name}?`)) {
      return
    }

    try {
      const result = await updateUserAction(user.id, { isActive: !user.isActive })
      if (!result.success) throw new Error(result.error)

      alert(`✅ Usuario ${action} exitosamente`)
      router.refresh()

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      alert(`❌ Error: ${errorMessage}`)
    }
  }

  async function handleImpersonate(user: User) {
    if (user.id === currentUserId) {
      alert('❌ Ya estás logueado como este usuario')
      return
    }

    if (!confirm(`¿Impersonar a ${user.name}?\n\nPodrás ver la aplicación como si fueras este usuario.`)) {
      return
    }

    try {
      const result = await getImpersonationDataAction(user.id)
      if (!result.success || !result.data) throw new Error(result.error)

      // Hacer signIn con el provider de impersonación
      const signInResult = await signIn('impersonate', {
        userId: result.data.userId,
        adminId: result.data.adminId,
        token: result.data.token,
        redirect: false
      })

      if (signInResult?.error) {
        throw new Error('Error al impersonar')
      }

      alert(`✅ Ahora estás viendo como ${user.name}`)

      // Redirigir a la página principal
      window.location.href = '/'

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      alert(`❌ Error: ${errorMessage}`)
    }
  }

  async function handleDelete(user: User) {
    if (user.id === currentUserId) {
      alert('❌ No puedes eliminar tu propia cuenta')
      return
    }

    if (!confirm(`¿ELIMINAR a ${user.name}?\n\nEsta acción no se puede deshacer. Se eliminarán sus participaciones y asignaciones.`)) {
      return
    }

    try {
      const result = await deleteUserAction(user.id)
      if (!result.success) throw new Error(result.error)

      alert('✅ Usuario eliminado exitosamente')
      router.refresh()

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      alert(`❌ Error: ${errorMessage}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Add Button */}
      <div className="flex justify-end">
        <button
          onClick={openCreateModal}
          className="px-6 py-3 bg-linear-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all font-semibold shadow-lg"
        >
          ➕ Nuevo Usuario
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Eventos
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-linear-to-r from-blue-600 to-green-600 flex items-center justify-center text-white font-bold">
                        {usuario.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {usuario.name}
                          {usuario.id === currentUserId && (
                            <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">
                              Tú
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {usuario.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {usuario.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {usuario.role === 'admin' ? (
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold">
                        👑 Admin
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-semibold">
                        Usuario
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {usuario.isActive ? (
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
                        ✓ Activo
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full text-xs font-semibold">
                        ✕ Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {usuario._count?.events || 0} participaciones
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => openEditModal(usuario)}
                        className="px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold transition-colors"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleImpersonate(usuario)}
                        disabled={usuario.id === currentUserId || !usuario.isActive}
                        className="px-3 py-1 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={usuario.id === currentUserId ? 'Ya eres este usuario' : !usuario.isActive ? 'Usuario inactivo' : 'Ver como este usuario'}
                      >
                        👤 Impersonar
                      </button>
                      <button
                        onClick={() => handleToggleActive(usuario)}
                        disabled={usuario.id === currentUserId}
                        className="px-3 py-1 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {usuario.isActive ? '⏸️ Desactivar' : '▶️ Activar'}
                      </button>
                      <button
                        onClick={() => handleDelete(usuario)}
                        disabled={usuario.id === currentUserId}
                        className="px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {modalMode === 'create' ? '➕ Nuevo Usuario' : '✏️ Editar Usuario'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                  placeholder="usuario@ejemplo.com"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Contraseña {modalMode === 'edit' && '(dejar vacío para no cambiar)'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required={modalMode === 'create'}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Rol
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Los administradores tienen acceso completo al sistema
                </p>
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Usuario activo
                  </span>
                </label>
                <p className="mt-1 ml-8 text-xs text-gray-500 dark:text-gray-400">
                  Los usuarios inactivos no pueden iniciar sesión
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-linear-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? '⏳ Guardando...' : modalMode === 'create' ? '✅ Crear Usuario' : '✅ Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
