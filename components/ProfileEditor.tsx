'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'

import { changePasswordAction, updateProfileAction } from '@/app/actions/profile'
import { applyActionErrors } from '@/lib/form-errors'
import {
  changePasswordSchema,
  updateProfileSchema,
  type ChangePasswordInput,
  type UpdateProfileInput,
} from '@/lib/validation/profile'

import { useToast } from './ToastProvider'
import { TwoFactorSetup } from './TwoFactorSetup'
import { User } from '@/app/generated/prisma'


interface ProfileEditorProps {
  user: User
}

export function ProfileEditor({ user }: ProfileEditorProps) {
  const router = useRouter()
  const toast = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const profileForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name || '',
      email: user.email,
    },
  })

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const handleUpdateProfile = profileForm.handleSubmit(async (values) => {
    const result = await updateProfileAction(values)

    if (!result.success) {
      applyActionErrors(result, profileForm.setError)
      toast.error(result.error ?? 'Error al actualizar perfil')
      return
    }

    toast.success(result.message ?? 'Perfil actualizado exitosamente')
    setIsEditing(false)
    router.refresh()
  })

  const handleChangePassword = passwordForm.handleSubmit(async (values) => {
    const result = await changePasswordAction(values)

    if (!result.success) {
      applyActionErrors(result, passwordForm.setError)
      toast.error(result.error ?? 'Error al cambiar contrasena')
      return
    }

    toast.success(result.message ?? 'Contrasena actualizada exitosamente')
    setIsChangingPassword(false)
    passwordForm.reset({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
  })

  return (
    <div className="p-6">
      {/* Perfil */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Información Personal
          </h2>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              ✏️ Editar
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {profileForm.formState.errors.root?.serverError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                {profileForm.formState.errors.root.serverError.message}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Tu nombre"
                disabled={profileForm.formState.isSubmitting}
                {...profileForm.register('name')}
              />
              {profileForm.formState.errors.name && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {profileForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={profileForm.formState.isSubmitting}
                {...profileForm.register('email')}
              />
              {profileForm.formState.errors.email && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{profileForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={profileForm.formState.isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
              >
                {profileForm.formState.isSubmitting ? '⏳ Guardando...' : '💾 Guardar Cambios'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  profileForm.reset({ name: user.name || '', email: user.email })
                }}
                disabled={profileForm.formState.isSubmitting}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium disabled:opacity-50"
              >
                ❌ Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Nombre</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {user.name || 'Sin nombre'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {user.email}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Cambiar Contraseña */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Seguridad

          </h2>
          {!isChangingPassword && (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              🔒 Cambiar Contraseña
            </button>
          )}
        </div>

        {isChangingPassword ? (
          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordForm.formState.errors.root?.serverError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                {passwordForm.formState.errors.root.serverError.message}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contraseña Actual
              </label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                disabled={passwordForm.formState.isSubmitting}
                {...passwordForm.register('currentPassword')}
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nueva Contraseña
              </label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                disabled={passwordForm.formState.isSubmitting}
                {...passwordForm.register('newPassword')}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Mínimo 6 caracteres
              </p>
              {passwordForm.formState.errors.newPassword && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                disabled={passwordForm.formState.isSubmitting}
                {...passwordForm.register('confirmPassword')}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={passwordForm.formState.isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
              >
                {passwordForm.formState.isSubmitting ? '⏳ Cambiando...' : '🔐 Cambiar Contraseña'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(false)
                  passwordForm.reset({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  })
                }}
                disabled={passwordForm.formState.isSubmitting}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium disabled:opacity-50"
              >
                ❌ Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Para cambiar tu contraseña, haz clic en el botón de arriba.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              💡 Tip: Usa una contraseña fuerte con letras, números y símbolos especiales.
            </p>
          </div>
        )}
      </div>

      {/* Autenticación de Dos Factores */}
      <TwoFactorSetup />
    </div>
  )
}
