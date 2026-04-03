'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Suspense } from 'react'

import { checkTwoFactorRequirementAction } from '@/app/actions/auth'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [requires2FA, setRequires2FA] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [credentials, setCredentials] = useState({ email: '', password: '' })

  useEffect(() => {
    // Mensajes de verificación de email
    if (searchParams.get('verified') === 'true') {
      setSuccess('¡Email verificado exitosamente! Ya puedes iniciar sesión.')
    } else if (searchParams.get('error') === 'invalid_token') {
      setError('Token de verificación inválido')
    } else if (searchParams.get('error') === 'expired_token') {
      setError('El token de verificación ha expirado. Solicita uno nuevo.')
    } else if (searchParams.get('error') === 'verification_failed') {
      setError('Error al verificar el email. Intenta nuevamente.')
    }
  }, [searchParams])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    console.log('🔐 Login attempt:', { email, password: '***' })

    try {
      // Primero verificar si requiere 2FA
      if (!requires2FA) {
        const checkResult = await checkTwoFactorRequirementAction({ email, password })

        if (!checkResult.success) {
          setError('Email o contraseña incorrectos')
          setLoading(false)
          return
        }

        if (checkResult.data?.requires2FA) {
          // Usuario requiere 2FA, mostrar campo
          setRequires2FA(true)
          setCredentials({ email, password })
          setLoading(false)
          return
        }
      }

      // Intentar login (con o sin 2FA)
      console.log('Calling signIn...')
      const result = await signIn('credentials', {
        email: requires2FA ? credentials.email : email,
        password: requires2FA ? credentials.password : password,
        twoFactorToken: requires2FA ? twoFactorCode : undefined,
        redirect: false
      })

      console.log('SignIn result:', result)

      if (result?.error) {
        console.error('Login error:', result.error)

        if (result.error === '2FA_REQUIRED') {
          setError('Se requiere código 2FA')
        } else if (result.error === 'INVALID_2FA_TOKEN') {
          setError('Código 2FA inválido o expirado')
          setTwoFactorCode('')
        } else {
          setError('Email o contraseña incorrectos')
          setRequires2FA(false)
          setTwoFactorCode('')
        }
      } else if (result?.ok) {
        console.log('Login successful, redirecting...')
        router.push('/')
        router.refresh()
      } else {
        console.log('Unexpected result:', result)
        setError('Error desconocido')
      }
    } catch (err) {
      console.error('Exception during login:', err)
      setError('Error inesperado al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setRequires2FA(false)
    setTwoFactorCode('')
    setError('')
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-linear-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            ⭐ Reyes Magos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Inicia sesión en el sorteo de amigo invisible
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 border-2 border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
            Iniciar Sesión
          </h2>

          {success && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {!requires2FA ? (
              <>
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="tu@email.com"
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Contraseña
                    </label>
                    <Link href="/auth/forgot-password" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
              </>
            ) : (
              <>
                {/* 2FA Code */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div className="text-sm">
                      <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">
                        Autenticación de Dos Factores
                      </p>
                      <p className="text-blue-700 dark:text-blue-400">
                        Ingresa el código de 6 dígitos de tu aplicación de autenticación
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Código de Verificación
                  </label>
                  <input
                    id="twoFactorCode"
                    type="text"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    autoFocus
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center text-2xl tracking-widest font-mono"
                    disabled={loading}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-50"
                >
                  ← Volver a credenciales
                </button>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (requires2FA && twoFactorCode.length !== 6)}
              className="w-full bg-linear-to-r from-blue-600 to-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verificando...' : requires2FA ? 'Verificar Código' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
              Regístrate aquí
            </Link>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2">
              🔑 Credenciales de prueba:
            </p>
            <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              <p><strong>Admin:</strong> admin@reyes.com / admin123</p>
              <p><strong>Usuario:</strong> cualquier usuario del seed / password123</p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
