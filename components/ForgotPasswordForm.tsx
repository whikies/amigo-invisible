'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { requestPasswordResetAction } from '@/app/actions/auth'
import { useToast } from '@/components/ToastProvider'
import { applyActionErrors } from '@/lib/form-errors'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validation/auth'

export function ForgotPasswordForm() {
  const toast = useToast()
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    const result = await requestPasswordResetAction(values)

    if (!result.success) {
      applyActionErrors(result, setError)
      toast.error(result.error ?? 'Error al procesar la solicitud')
      return
    }

    toast.success(result.message ?? 'Revisa tu email para restablecer tu contrasena')
    setSent(true)
  })

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 animate-fade-in">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Email Enviado
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Si el email existe en nuestro sistema, recibiras un enlace para restablecer tu contrasena.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              Revisa tu bandeja de entrada y spam. El enlace expirara en 1 hora.
            </p>
            <Link
              href="/login"
              className="inline-block text-blue-600 dark:text-blue-400 hover:underline"
            >
              Volver al inicio de sesion
            </Link>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Olvidaste tu contrasena?
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Ingresa tu email y te enviaremos un enlace para restablecerla
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {errors.root?.serverError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {errors.root.serverError.message}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="tu@email.com"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={isSubmitting}
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Enlace de Recuperacion'}
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
