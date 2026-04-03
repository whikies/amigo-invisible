'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { registerUserAction } from '@/app/actions/auth'
import { applyActionErrors } from '@/lib/form-errors'
import { registerSchema, type RegisterInput } from '@/lib/validation/auth'

interface RegisterFormProps {
  defaultEmail?: string
  defaultInvitationCode?: string
}

export function RegisterForm({ defaultEmail = '', defaultInvitationCode = '' }: RegisterFormProps) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      invitationCode: defaultInvitationCode,
      name: '',
      email: defaultEmail,
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    const result = await registerUserAction(values)

    if (!result.success) {
      applyActionErrors(result, setError)
      return
    }

    const signInResult = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    })

    if (signInResult?.ok) {
      router.push('/dashboard')
      router.refresh()
      return
    }

    setError('root.serverError', {
      type: 'server',
      message: 'Cuenta creada pero error al iniciar sesion',
    })
  })

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-linear-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Amigo Invisible
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Crea tu cuenta para participar en el sorteo
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 border-2 border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
            Crear Cuenta
          </h2>

          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Registro por invitacion</strong>
                <p className="mt-1">Necesitas un codigo de invitacion valido para registrarte.</p>
              </div>
            </div>
          </div>

          {errors.root?.serverError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {errors.root.serverError.message}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="invitationCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Codigo de Invitacion *
              </label>
              <input
                id="invitationCode"
                type="text"
                maxLength={8}
                className="w-full px-4 py-2 border-2 border-blue-300 dark:border-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-lg tracking-wider text-center"
                placeholder="XXXXXXXX"
                style={{ textTransform: 'uppercase' }}
                {...register('invitationCode')}
              />
              {errors.invitationCode && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.invitationCode.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre Completo *
              </label>
              <input
                id="name"
                type="text"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Juan Perez"
                {...register('name')}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="tu@email.com"
                {...register('email')}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Debe coincidir con el email de la invitacion
              </p>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contrasena *
              </label>
              <input
                id="password"
                type="password"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="••••••••"
                {...register('password')}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Minimo 6 caracteres
              </p>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirmar Contrasena *
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="••••••••"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-linear-to-r from-blue-600 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creando cuenta...' : 'Registrarse'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Ya tienes cuenta?{' '}
            </span>
            <Link
              href="/login"
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              Iniciar Sesion
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
