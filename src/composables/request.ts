export const api: string = import.meta.env.VITE_API_URL
export const getAppToken = () => {
  const bugreveal_app_token = localStorage.getItem('bugreveal_app_token')
  const data = bugreveal_app_token !== null ? JSON.parse(bugreveal_app_token) : null
  return data?.token
}
interface BodyData {
  [key: string]: unknown
}

export async function customFetch(path: string, options: RequestInit): Promise<Response> {
  const response = await fetch(`${api}/${path}`, options)
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
