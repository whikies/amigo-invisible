'use client'

import { useState } from 'react'

interface DecryptAssignmentProps {
  eventId: number
  encryptedData: {
    encrypted: string
    iv: string
    salt: string
    authTag: string
  }
}

interface DecryptedUser {
  id: number
  name: string
  email: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DecryptAssignment({ eventId, encryptedData }: DecryptAssignmentProps) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [decryptedUser, setDecryptedUser] = useState<DecryptedUser | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  async function handleDecrypt(e: React.FormEvent) {
    e.preventDefault()

    if (!password) {
      setError('Ingresa tu contraseña')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/decrypt-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password,
          encryptedData
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al descifrar')
      }

      setDecryptedUser(data.user)
      setPassword('') // Clear password
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error decrypting:', err)
      setError(err.message || 'Contraseña incorrecta o error al descifrar')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setDecryptedUser(null)
    setPassword('')
    setError('')
  }

  if (decryptedUser) {
    return (
      <div className="space-y-4">
        {/* Success Message */}
        <div className="bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border-2 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">🎁</span>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-green-900 dark:text-green-200 mb-1">
                ¡Tu asignación revelada!
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Debes hacerle el regalo a:
              </p>
            </div>
          </div>

          {/* Assigned User */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-linear-to-r from-blue-600 to-green-600 flex items-center justify-center text-white text-2xl font-bold">
                {decryptedUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {decryptedUser.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {decryptedUser.email}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-semibold"
          >
            🔒 Ocultar
          </button>
          <div className="flex-1 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-end">
            💡 Recuerda que nadie más puede ver esta información
          </div>
        </div>

        {/* Warning */}
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-800 dark:text-amber-300">
            ⚠️ <strong>Importante:</strong> No compartas esta información con nadie. Mantén la sorpresa del amigo invisible.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleDecrypt} className="space-y-4">
      {/* Locked State */}
      <div className="bg-linear-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">🔐</span>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-purple-900 dark:text-purple-200 mb-1">
              Asignación cifrada
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Ingresa tu contraseña para ver a quién le toca hacerle el regalo
            </p>
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-3">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              className="w-full px-4 py-3 border-2 border-purple-200 dark:border-purple-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white pr-12"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? '🔓 Descifrando...' : '🔓 Descifrar mi asignación'}
          </button>
        </div>
      </div>

      {/* Help Text */}
      <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
        💡 Es la misma contraseña que usas para iniciar sesión
      </div>
    </form>
  )
}
