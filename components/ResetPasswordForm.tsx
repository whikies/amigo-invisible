'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { resetPasswordAction } from '@/app/actions/auth'
import { useToast } from '@/components/ToastProvider'
import { applyActionErrors } from '@/lib/form-errors'
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validation/auth'

interface ResetPasswordFormProps {
  token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter()
  const toast = useToast()
  const [success, setSuccess] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    const result = await resetPasswordAction(values)

    if (!result.success) {
      applyActionErrors(result, setError)
      toast.error(result.error ?? 'Error al restablecer la contrasena')
      return
    }

    toast.success(result.message ?? 'Contrasena actualizada exitosamente')
    setSuccess(true)

    setTimeout(() => {
      router.push('/login')
    }, 2000)
  })

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 animate-fade-in">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Contrasena Actualizada
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tu contrasena ha sido restablecida exitosamente.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Redirigiendo al inicio de sesion...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Nueva Contrasena
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Ingresa tu nueva contrasena
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {errors.root?.serverError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {errors.root.serverError.message}
            </div>
          )}

          <input type="hidden" {...register('token')} />

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nueva Contrasena
            </label>
            <input
              id="password"
              type="password"
              placeholder="Minimo 6 caracteres"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={isSubmitting}
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirmar Contrasena
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Repite tu contrasena"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={isSubmitting}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Actualizando...' : 'Restablecer Contrasena'}
          </button>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Volver al inicio de sesion
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
