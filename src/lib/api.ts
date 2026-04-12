import { clearStoredAuth, readStoredAuth, writeStoredAuth } from './authStorage'

function apiBase(): string {
  const b = import.meta.env.VITE_FLORA_HIVE_URL ?? ''
  return b.replace(/\/$/, '')
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return { raw: text }
  }
}

let refreshInFlight: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  const stored = readStoredAuth()
  if (!stored?.refresh_token) return false
  const res = await fetch(`${apiBase()}/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: stored.refresh_token }),
  })
  const data = (await parseJson(res)) as Record<string, unknown> | null
  if (!res.ok || !data || typeof data.access_token !== 'string' || typeof data.refresh_token !== 'string') {
    clearStoredAuth()
    return false
  }
  writeStoredAuth({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  })
  return true
}

export async function hiveFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = `${apiBase()}${path.startsWith('/') ? path : `/${path}`}`
  const stored = readStoredAuth()
  const headers = new Headers(init.headers)
  if (stored?.access_token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${stored.access_token}`)
  }
  let res = await fetch(url, { ...init, headers })

  if (res.status === 401 && stored?.refresh_token) {
    refreshInFlight ??= tryRefresh().finally(() => {
      refreshInFlight = null
    })
    const ok = await refreshInFlight
    if (ok) {
      const h2 = new Headers(init.headers)
      const next = readStoredAuth()
      if (next?.access_token) h2.set('Authorization', `Bearer ${next.access_token}`)
      res = await fetch(url, { ...init, headers: h2 })
    }
  }

  return res
}

export async function hiveJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await hiveFetch(path, init)
  const data = await parseJson(res)
  if (!res.ok) {
    const msg =
      typeof (data as { message?: unknown } | null)?.message === 'string'
        ? (data as { message: string }).message
        : `request failed (${res.status})`
    throw new Error(msg)
  }
  return data as T
}

export { apiBase }
