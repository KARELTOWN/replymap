export const api: string = import.meta.env.VITE_API_URL

const STORAGE_KEY = 'bugreveal_app_token'

// The access token (15 minutes) is kept here. The refresh token is not: the
// API keeps it in an HttpOnly cookie that no script can read, on the model of
// Horizon. The dashboard and the SSO window share that cookie, so a session
// opened in one is available in the other.
export interface AppSession {
  token: string
  // Encrypted user identifier returned by the API at sign-in.
  data?: string
}

// Readable companion of the refresh cookie: its presence says a session may
// be renewed, and its value is echoed in `X-Refresh-CSRF`. Dev and staging use
// their own name, like the API.
const APP_ENV: string = import.meta.env.VITE_APP_ENV ?? ''
const CSRF_COOKIE = ['dev', 'staging'].includes(APP_ENV) ? `refresh_csrf_${APP_ENV}` : 'refresh_csrf'

const readCookie = (name: string): string | null => {
  const entry = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null
}

export const hasSessionCookie = (): boolean => readCookie(CSRF_COOKIE) !== null

export const getSession = (): AppSession | null => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === null) return null
  try {
    const parsed = JSON.parse(raw)
    return parsed?.token ? (parsed as AppSession) : null
  } catch {
    return null
  }
}

export const setSession = (session: AppSession): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export const clearSession = (): void => {
  localStorage.removeItem(STORAGE_KEY)
}

export const getAppToken = (): string | undefined => getSession()?.token

interface BodyData {
  [key: string]: unknown
}

// One refresh at a time: without this sharing, the parallel requests of a
// page each triggered their own renewal when the token expired.
let pendingRefresh: Promise<string | null> | null = null

export const refreshAccessToken = async (): Promise<string | null> => {
  const csrf = readCookie(CSRF_COOKIE)
  if (csrf === null) return null

  if (pendingRefresh === null) {
    pendingRefresh = (async () => {
      try {
        const response = await fetch(`${api}/auth/refresh-token`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'X-Refresh-CSRF': csrf },
        })
        if (!response.ok) return null

        const body = await response.json()
        const token: string | undefined = body?.data?.token
        if (!token) return null

        setSession({ ...getSession(), token })
        return token
      } catch {
        return null
      } finally {
        pendingRefresh = null
      }
    })()
  }

  return pendingRefresh
}

const redirectToSignin = (): void => {
  clearSession()
  if (window.location.pathname !== '/signin') {
    window.location.href = '/signin'
  }
}

// The authorisation header is set here, at send time, not by the caller: the
// replay after renewal must leave with the fresh token.
const withAuthorization = (options: RequestInit): RequestInit => {
  // `include`: the session cookies are set and read by the API, on another
  // origin than the dashboard.
  const token = getAppToken()
  if (!token) return { ...options, credentials: 'include' }
  const headers = new Headers(options.headers || {})
  headers.set('Authorization', `Bearer ${token}`)
  return { ...options, headers, credentials: 'include' }
}

// The access token lives 15 minutes: a 401 renews it once through the refresh
// cookie, then replays the request.
export async function customFetch(
  path: string,
  options: RequestInit,
  allowRetry = true,
): Promise<Response> {
  const response = await fetch(`${api}/${path}`, withAuthorization(options))

  if (response.status === 401 && allowRetry) {
    const token = await refreshAccessToken()
    if (token) {
      return customFetch(path, options, false)
    }
    redirectToSignin()
  }

  return response
}

const jsonHeaders = {
  'Content-Type': 'application/json;charset=utf-8',
  Accept: 'application/json;charset=utf-8',
}

export const fetchPost = async (path: string, body: BodyData): Promise<Response> => {
  return customFetch(path, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(body),
  })
}

export const fetchGet = async (path: string): Promise<Response> => {
  return customFetch(path, {
    method: 'GET',
    headers: jsonHeaders,
  })
}

export const fetchPut = async (path: string, body: BodyData): Promise<Response> => {
  return customFetch(path, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify(body),
  })
}

export const fetchPatch = async (path: string, body: BodyData): Promise<Response> => {
  return customFetch(path, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(body),
  })
}

export const fetchDestroy = async (path: string): Promise<Response> => {
  return customFetch(path, {
    method: 'DELETE',
    headers: jsonHeaders,
  })
}

// Multipart upload (attachments): the browser must set the Content-Type
// itself, with its boundary, so no header is set here.
export const fetchPostForm = async (path: string, form: FormData): Promise<Response> => {
  return customFetch(path, {
    method: 'POST',
    body: form,
  })
}
