'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'

import {
  disableTwoFactorAction,
  enableTwoFactorAction,
  setupTwoFactorAction,
} from '@/app/actions/two-factor'

import { useToast } from './ToastProvider'
import { ConfirmDialog } from './ConfirmDialog'

export function TwoFactorSetup() {
  const { data: session, update: updateSession } = useSession()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [setupMode, setSetupMode] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [showDisableDialog, setShowDisableDialog] = useState(false)

  const is2FAEnabled = session?.user?.twoFactorEnabled

  const handleStartSetup = async () => {
    setLoading(true)

    try {
      const result = await setupTwoFactorAction()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Error al iniciar configuracion')
      }

      setQrCode(result.data.qrCode)
      setSecret(result.data.secret)
      setSetupMode(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al configurar 2FA')
    } finally {
      setLoading(false)
    }
  }

  const handleEnableTwoFactor = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.warning('Ingresa un código de 6 dígitos')
      return
    }

    setLoading(true)

    try {
      const result = await enableTwoFactorAction({
        secret: secret ?? '',
        token: verificationCode,
      })

      if (!result.success) {
        throw new Error(result.error || 'Error al habilitar 2FA')
      }

      toast.success('2FA habilitado exitosamente')
      setSetupMode(false)
      setQrCode(null)
      setSecret(null)
      setVerificationCode('')

      // Actualizar sesión
      await updateSession()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al habilitar 2FA')
    } finally {
      setLoading(false)
    }
  }

  const handleDisableTwoFactor = async () => {
    if (!disablePassword) {
      toast.warning('Ingresa tu contraseña')
      return
    }

    setLoading(true)

    try {
      const result = await disableTwoFactorAction({
        password: disablePassword,
      })

      if (!result.success) {
        throw new Error(result.error || 'Error al deshabilitar 2FA')
      }

      toast.success('2FA deshabilitado exitosamente')
      setShowDisableDialog(false)
      setDisablePassword('')

      // Actualizar sesión
      await updateSession()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al deshabilitar 2FA')
    } finally {
      setLoading(false)
    }
  }

  if (setupMode) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Configurar Autenticación de Dos Factores
        </h3>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              1. Escanea este código QR con tu aplicación de autenticación (Google Authenticator, Authy, etc.)
            </p>
            {qrCode && (
              <div className="flex justify-center p-4 bg-white rounded">
                <Image
                  src={qrCode}
                  alt="QR Code para 2FA"
                  width={256}
                  height={256}
                  unoptimized
                  className="w-64 h-64"
                />
              </div>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              2. O ingresa manualmente este código en tu aplicación:
            </p>
            <code className="block p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono break-all">
              {secret}
            </code>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              3. Ingresa el código de 6 dígitos generado por tu aplicación para verificar:
            </p>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center text-2xl tracking-widest font-mono"
              disabled={loading}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleEnableTwoFactor}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verificando...' : 'Verificar y Habilitar'}
            </button>
            <button
              onClick={() => {
                setSetupMode(false)
                setQrCode(null)
                setSecret(null)
                setVerificationCode('')
              }}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Autenticación de Dos Factores
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {is2FAEnabled
                ? 'Tu cuenta está protegida con 2FA'
                : 'Agrega una capa extra de seguridad a tu cuenta'}
            </p>
          </div>
          <div className="shrink-0">
            {is2FAEnabled ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Habilitado
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                Deshabilitado
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {!is2FAEnabled && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-medium mb-1">¿Qué necesitas?</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-400">
                    <li>Una aplicación de autenticación (Google Authenticator, Authy, Microsoft Authenticator)</li>
                    <li>Acceso a tu teléfono móvil</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {is2FAEnabled ? (
            <button
              onClick={() => setShowDisableDialog(true)}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Deshabilitar 2FA
            </button>
          ) : (
            <button
              onClick={handleStartSetup}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Cargando...' : 'Configurar 2FA'}
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDisableDialog}
        onClose={() => {
          setShowDisableDialog(false)
          setDisablePassword('')
        }}
        onConfirm={handleDisableTwoFactor}
        title="Deshabilitar 2FA"
        type="danger"
        loading={loading}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Esto eliminará la capa extra de seguridad de tu cuenta. Para continuar, ingresa tu contraseña:
          </p>
          <input
            type="password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            placeholder="Tu contraseña"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            disabled={loading}
          />
        </div>
      </ConfirmDialog>
    </>
  )
}
