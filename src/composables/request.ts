export const api: string = import.meta.env.VITE_API_URL
// The SSO sign-in stores its session under its own key (see
// `composables/session.ts`): without this fallback, authenticated calls from
// this application left without a token and always ended in a 401.
const readStored = (key: string) => {
  const raw = localStorage.getItem(key)
  if (raw === null) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const getAppToken = () => {
  return readStored('bugreveal_sso_session')?.token ?? readStored('bugreveal_app_token')?.token
}
interface BodyData {
  [key: string]: unknown
}

// `include`: the session cookies are set by the API, on another origin.
export async function customFetch(path: string, options: RequestInit): Promise<Response> {
  const response = await fetch(`${api}/${path}`, { ...options, credentials: 'include' })
  if (response.status === 401) {
    localStorage.removeItem('bugreveal_app_token')
    window.location.href = '/signin'
  }

  return response
}

export const fetchPost = async (path: string, body: BodyData): Promise<Response> => {
  return customFetch(`${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      Accept: 'application/json;charset=utf-8',
      Authorization: `Bearer ${getAppToken()}`,
    },
    body: JSON.stringify(body),
  })
}

export const fetchGet = async (path: string): Promise<Response> => {
  return customFetch(`${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      Accept: 'application/json;charset=utf-8',
      Authorization: `Bearer ${getAppToken()}`,
    },
  })
}

export const fetchPut = async (path: string, body: BodyData): Promise<Response> => {
  return customFetch(`${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      Accept: 'application/json;charset=utf-8',
      Authorization: `Bearer ${getAppToken()}`,
    },
    body: JSON.stringify(body),
  })
}

export const fetchPatch = async (path: string, body: BodyData): Promise<Response> => {
  return customFetch(`${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      Accept: 'application/json;charset=utf-8',
      Authorization: `Bearer ${getAppToken()}`,
    },
    body: JSON.stringify(body),
  })
}

export const fetchDestroy = async (path: string): Promise<Response> => {
  return customFetch(`${path}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      Accept: 'application/json;charset=utf-8',
      Authorization: `Bearer ${getAppToken()}`,
    },
  })
}
