import { ValidationError } from 'yup'
import { errorNotify } from './notification'

export const handleLoginError = async (response: Response): Promise<object> => {
  const res = await response.json()
  if (!response.ok) {
    const errors = []
    if (response.status == 422) {
      errorNotify('Email ou mot de passe invalide')
      if (res.errors.length > 0) {
        for (const element of res.errors) {
          errors[element.path] = element.msg
        }
      }
      return { status: true, errors: errors }
    } else if (response.status == 403) {
      errorNotify(res.message)
    } else {
      errorNotify("Une erreur s'est produite")
    }
    return { status: true, errors: null }
  } else {
    return { status: false, data: res?.data }
  }
}

export const handleAppError = async (response: Response): Promise<object> => {
  const res = await response.json()
  if (!response.ok) {
    const errors = []
    if (response.status == 422) {
      errorNotify('Informations invalides')
      if (res.errors.length > 0) {
        for (const element of res.errors) {
          errors[element.path] = element.msg
        }
      }
      return { status: true, errors: errors }
    } else if (response.status == 403) {
      errorNotify(res.message)
    } else if (response.status == 404) {
      errorNotify(res.message)
    } else {
      errorNotify("Une erreur s'est produite")
    }
    return { status: true, errors: null }
  } else {
    return { status: false, data: res?.data }
  }
}

export const handleCatchError = (err) => {
  if (err) {
    if (err instanceof ValidationError) {
      const errors = []
      err.inner.forEach((e) => {
        errors[e.path] = e.message
      })
      return errors
    } else {
      console.log('handleCatchError', err)
      errorNotify("Une erreur inattendue s'est produite")
    }
  }
}
