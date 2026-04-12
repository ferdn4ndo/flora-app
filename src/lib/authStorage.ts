import { AUTH_STORAGE_KEY } from './constants'

export type StoredAuth = {
  access_token: string
  refresh_token: string
}

export function readStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as unknown
    if (
      !p ||
      typeof p !== 'object' ||
      typeof (p as StoredAuth).access_token !== 'string' ||
      typeof (p as StoredAuth).refresh_token !== 'string'
    ) {
      return null
    }
    return p as StoredAuth
  } catch {
    return null
  }
}

export function writeStoredAuth(tokens: StoredAuth): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens))
}

export function clearStoredAuth(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}
