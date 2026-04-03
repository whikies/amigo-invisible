'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import {
  createWishListItemAction,
  getWishListAction,
  deleteWishListItemAction,
  updateWishListPurchasedAction,
} from '@/app/actions/wishlist'
import {
  createWishListFormSchema,
} from '@/lib/validation/wishlist'

import { useToast } from './ToastProvider'
import { ConfirmDialog } from './ConfirmDialog'

interface WishListItem {
  id: number
  item: string
  priority: number
  link?: string | null
  isPurchased: boolean
  createdAt: Date
}

interface WishListProps {
  eventId: number
  userId?: number
  canEdit?: boolean
}

export function WishList({ eventId, userId, canEdit = false }: WishListProps) {
  const toast = useToast()
  const [items, setItems] = useState<WishListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  type FormValuesInput = z.input<typeof createWishListFormSchema>
  type FormValuesOutput = z.output<typeof createWishListFormSchema>
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValuesInput, unknown, FormValuesOutput>({
    resolver: zodResolver(createWishListFormSchema),
    defaultValues: {
      item: '',
      priority: 0,
      link: '',
    },
  })

  const fetchWishList = useCallback(async () => {
    try {
      const result = await getWishListAction({ eventId, userId })
      if (!result.success) throw new Error(result.error || 'Error al cargar lista')

      setItems(result.data || [])
    } catch {
      toast.error('Error al cargar lista de deseos')
    } finally {
      setLoading(false)
    }
  }, [eventId, toast, userId])

  useEffect(() => {
    void fetchWishList()
  }, [fetchWishList])

  const handleAddItem = handleSubmit(async (values) => {
    const result = await createWishListItemAction({
      eventId,
      ...values,
      link: values.link || undefined,
    })

    if (!result.success) {
      toast.error(result.error ?? 'Error al agregar item')
      return
    }

    toast.success('Item agregado a la lista')
    reset({ item: '', priority: 0, link: '' })
    setShowAddForm(false)
    fetchWishList()
  })

  const handleDelete = async () => {
    if (!deleteId) return

    setDeleting(true)

    try {
      const result = await deleteWishListItemAction(deleteId)
      if (!result.success) throw new Error(result.error)

      toast.success('Item eliminado')
      fetchWishList()
    } catch {
      toast.error('Error al eliminar item')
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const handleTogglePurchased = async (id: number, isPurchased: boolean) => {
    try {
      const result = await updateWishListPurchasedAction({
        id,
        isPurchased: !isPurchased,
      })
      if (!result.success) throw new Error(result.error)

      toast.success(isPurchased ? 'Marcado como no comprado' : 'Marcado como comprado')
      fetchWishList()
    } catch {
      toast.error('Error al actualizar estado')
    }
  }

  const getPriorityBadge = (priority: number) => {
    if (priority === 2) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">Alta</span>
    } else if (priority === 1) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">Media</span>
    } else {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">Baja</span>
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Mi Lista de Deseos
          </h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
          >
            {showAddForm ? 'Cancelar' : '+ Agregar Item'}
          </button>
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleAddItem} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3 animate-fade-in">
          {errors.root?.message && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.root.message}</p>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción del regalo / Hint
            </label>
            <input
              type="text"
              placeholder="Ej: Libro de cocina, auriculares bluetooth..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              disabled={isSubmitting}
              {...register('item')}
            />
            {errors.item && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.item.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prioridad
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                disabled={isSubmitting}
                {...register('priority', { valueAsNumber: true })}
              >
                <option value={0}>Baja</option>
                <option value={1}>Media</option>
                <option value={2}>Alta</option>
              </select>
              {errors.priority && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.priority.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Link (opcional)
              </label>
              <input
                type="url"
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                disabled={isSubmitting}
                {...register('link')}
              />
              {errors.link && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.link.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Agregando...' : 'Agregar a mi lista'}
          </button>
        </form>
      )}

      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>{canEdit ? 'Aún no has agregado items a tu lista' : 'No hay items en la lista de deseos'}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getPriorityBadge(item.priority)}
                    {item.isPurchased && (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                        ✓ Comprado
                      </span>
                    )}
                  </div>
                  <p className="text-gray-900 dark:text-white font-medium">{item.item}</p>
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      Ver link
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>

                {canEdit && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                      title="Eliminar"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}

                {!canEdit && (
                  <button
                    onClick={() => handleTogglePurchased(item.id, item.isPurchased)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                      item.isPurchased
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {item.isPurchased ? 'Desmarcar' : 'Marcar comprado'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Item"
        message="¿Seguro que deseas eliminar este item de tu lista de deseos?"
        type="danger"
        loading={deleting}
      />
    </div>
  )
}
