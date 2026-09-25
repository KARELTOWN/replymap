import { api } from '@/composables/request'

// Session of the sign-in window, on the model of Horizon.
//
// Only the access token (15 minutes) is kept in localStorage, for the calls
// this window makes itself. The refresh token lives in an HttpOnly cookie set
// by the API and shared with the dashboard: signing in to the dashboard also
// signs in this window, and no script can read that token.

const STORAGE_KEY = 'bugreveal_sso_session'

interface SsoSession {
  token: string
}

// Readable companion of the refresh cookie, echoed in `X-Refresh-CSRF`. Dev
// and staging use their own name, like the API.
const APP_ENV: string = import.meta.env.VITE_APP_ENV ?? ''
const CSRF_COOKIE = ['dev', 'staging'].includes(APP_ENV) ? `refresh_csrf_${APP_ENV}` : 'refresh_csrf'

const readCookie = (name: string): string | null => {
  const entry = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null
}

export function getStoredSession(): SsoSession | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return parsed?.token ? { token: parsed.token } : null
  } catch {
    return null
  }
}

export function setStoredSession(session: SsoSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: session.token }))
}

export function clearStoredSession(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Renews the session from the refresh cookie, without any form.
 *
 * @returns a fresh access token, or null when no session is open.
 */
export async function renewFromCookie(): Promise<string | null> {
  const csrf = readCookie(CSRF_COOKIE)
  if (csrf === null) return null

  const response = await fetch(`${api}/auth/refresh-token`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-Refresh-CSRF': csrf },
  })
  if (!response.ok) {
    clearStoredSession()
    return null
  }

  const body = await response.json()
  const token: string | undefined = body?.data?.token
  if (!token) return null
  setStoredSession({ token })
  return token
}
