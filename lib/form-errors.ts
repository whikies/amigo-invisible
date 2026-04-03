import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

import type { ActionResult } from '@/lib/action-result'

export function applyActionErrors<TFieldValues extends FieldValues>(
  result: ActionResult<unknown>,
  setError: UseFormSetError<TFieldValues>
) {
  if (result.fieldErrors) {
    Object.entries(result.fieldErrors).forEach(([field, messages]) => {
      const message = messages?.[0]

      if (message) {
        setError(field as Path<TFieldValues>, {
          type: 'server',
          message,
        })
      }
    })
  }

  if (result.error) {
    setError('root.serverError' as Path<TFieldValues>, {
      type: 'server',
      message: result.error,
    })
  }
}
