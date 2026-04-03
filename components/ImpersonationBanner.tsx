'use client'

import { signOut } from 'next-auth/react'

interface ImpersonationBannerProps {
  userName: string
  adminId: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ImpersonationBanner({ userName, adminId }: ImpersonationBannerProps) {
  async function handleStopImpersonating() {
    if (confirm('¿Volver a tu cuenta de administrador?')) {
      // Hacer logout para volver a tu cuenta
      await signOut({ redirect: true, callbackUrl: '/admin/usuarios' })
    }
  }

  return (
    <div className="bg-linear-to-r from-purple-600 to-pink-600 text-white py-2 px-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">👤</span>
          <span className="text-sm font-semibold">
            Estás viendo como: <span className="font-bold">{userName}</span>
          </span>
        </div>
        <button
          onClick={handleStopImpersonating}
          className="px-4 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-colors"
        >
          ← Volver a mi cuenta
        </button>
      </div>
    </div>
  )
}
