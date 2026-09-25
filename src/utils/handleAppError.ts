import { ValidationError } from 'yup'
import { errorNotify } from './notification'

// Sign-in answers like every other route: the shared envelope. Kept as a
// separate name because the sign-in screens import it.
export const handleLoginError = (response: Response): Promise<object> => handleAppError(response)

// The API is being migrated to a single response envelope, module by module:
//
//   success  { "success": true,  "message": "...", "data": {...}, "meta": {...} }
//   failure  { "success": false, "error": { "code": "...", "message": "...",
//                                           "details": [{ "field", "message" }] } }
//
// Routes that have not been migrated yet still answer with the legacy shape
// `{ message, data }` and, on validation, `{ errors: [{ path, msg }] }`. Both
// are read here so the dashboard keeps working during the transition.
// Remove the legacy branches once every module is migrated.
const readFieldErrors = (body: any): Record<string, string> => {
  const fields: Record<string, string> = {}

  for (const detail of body?.error?.details ?? []) {
    if (detail?.field) fields[detail.field] = detail.message
  }
  for (const legacy of body?.errors ?? []) {
    if (legacy?.path) fields[legacy.path] = legacy.msg
  }
  return fields
}

const readMessage = (body: any): string =>
  body?.error?.message || body?.message || "Une erreur s'est produite"

export const handleAppError = async (response: Response): Promise<object> => {
  const res = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 422) {
      errorNotify(readMessage(res))
      return { status: true, errors: readFieldErrors(res) }
    }
    errorNotify(readMessage(res))
    return { status: true, errors: null }
  }

  return { status: false, data: res?.data, message: res?.message, meta: res?.meta }
}

export const handleCatchError = (err:any) => {
  if (err) {
    if (err instanceof ValidationError) {
      const errors:any = []
      err.inner.forEach((e: any) => {
        errors[e.path] = e.message
      })
      return errors
    } else {
      console.log('handleCatchError', err)
      errorNotify("Une erreur inattendue s'est produite")
    }
  }
}
