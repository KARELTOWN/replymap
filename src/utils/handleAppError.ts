import { ValidationError } from 'yup'
import { errorNotify } from './notification'

// Every API route answers with the same envelope:
//
//   success  { "success": true,  "message": "...", "data": {...} }
//   failure  { "success": false, "error": { "code": "...", "message": "...",
//                                           "details": [{ "field", "message" }] } }
//
// The message is already translated by the API.
const readFieldErrors = (body: any): Record<string, string> => {
  const fields: Record<string, string> = {}
  for (const detail of body?.error?.details ?? []) {
    if (detail?.field) fields[detail.field] = detail.message
  }
  return fields
}

const readMessage = (body: any): string =>
  body?.error?.message || body?.message || "Une erreur s'est produite"

export const handleAppError = async (response: Response): Promise<object> => {
  const res = await response.json().catch(() => ({}))
  if (!response.ok) {
    errorNotify(readMessage(res))
    if (response.status === 422) return { status: true, errors: readFieldErrors(res) }
    return { status: true, errors: null, code: res?.error?.code }
  }
  return { status: false, data: res?.data }
}

export const handleLoginError = (response: Response): Promise<object> => handleAppError(response)

export const handleCatchError = (err: unknown) => {
  if (err) {
    if (err instanceof ValidationError) {
      // An array was used as a dictionary, indexed by field name.
      const errors: Record<string, string> = {}
      err.inner.forEach((e) => {
        if (e.path) errors[e.path] = e.message
      })
      return errors
    } else {
      console.log('handleCatchError', err)
      errorNotify("Une erreur inattendue s'est produite")
    }
  }
}
