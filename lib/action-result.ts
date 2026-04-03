export type ActionFieldErrors = Record<string, string[] | undefined>

export interface ActionResult<T = undefined> {
  success: boolean
  message?: string
  error?: string
  fieldErrors?: ActionFieldErrors
  data?: T
}
