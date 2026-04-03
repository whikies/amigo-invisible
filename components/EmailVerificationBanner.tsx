'use client'

import { useState } from 'react'
import { useToast } from './ToastProvider'

export function EmailVerificationBanner() {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [hidden, setHidden] = useState(false)

  const handleResend = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar email')
      }

      toast.success('Email de verificación enviado. Revisa tu bandeja de entrada.')
      setHidden(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al enviar email')
    } finally {
      setLoading(false)
    }
  }

  if (hidden) {
    return null
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-3 animate-slide-up">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              Tu email no está verificado
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
              Verifica tu email para acceder a todas las funcionalidades
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResend}
            disabled={loading}
            className="text-sm font-medium text-yellow-800 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-200 underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Enviando...' : 'Reenviar email'}
          </button>
          <button
            onClick={() => setHidden(true)}
            className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 p-1"
            aria-label="Cerrar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
