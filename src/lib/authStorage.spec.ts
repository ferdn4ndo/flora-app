import { afterEach, describe, expect, it } from 'vitest'

import { AUTH_STORAGE_KEY } from '@/lib/constants'
import { clearStoredAuth, readStoredAuth, writeStoredAuth } from '@/lib/authStorage'

describe('authStorage', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('returns null when nothing is stored', () => {
    expect(readStoredAuth()).toBeNull()
  })

  it('round-trips valid tokens', () => {
    writeStoredAuth({ access_token: 'a', refresh_token: 'r' })
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeTruthy()
    expect(readStoredAuth()).toEqual({ access_token: 'a', refresh_token: 'r' })
  })

  it('returns null for malformed JSON', () => {
    localStorage.setItem(AUTH_STORAGE_KEY, '{')
    expect(readStoredAuth()).toBeNull()
  })

  it('returns null when tokens are not strings', () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ access_token: 1, refresh_token: 'r' }))
    expect(readStoredAuth()).toBeNull()
  })

  it('clearStoredAuth removes the key', () => {
    writeStoredAuth({ access_token: 'a', refresh_token: 'r' })
    clearStoredAuth()
    expect(readStoredAuth()).toBeNull()
  })
})
