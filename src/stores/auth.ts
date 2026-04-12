import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { apiBase, hiveFetch, hiveJson } from '@/lib/api'
import { clearStoredAuth, readStoredAuth, writeStoredAuth } from '@/lib/authStorage'
import type { LoginResponse, MeResponse } from '@/types/hive'

export const useAuthStore = defineStore('auth', () => {
  const me = ref<MeResponse | null>(null)
  const loadingMe = ref(false)
  const bootstrapped = ref(false)
  const hasSession = ref(!!readStoredAuth()?.access_token)

  const isAuthenticated = computed(() => hasSession.value)

  async function bootstrap() {
    if (!readStoredAuth()?.access_token) {
      hasSession.value = false
      me.value = null
      bootstrapped.value = true
      return
    }
    hasSession.value = true
    loadingMe.value = true
    const ac = new AbortController()
    const tid = setTimeout(() => ac.abort(), 12_000)
    try {
      me.value = await hiveJson<MeResponse>('/v1/auth/me', { signal: ac.signal })
    } catch {
      me.value = null
      clearStoredAuth()
      hasSession.value = false
    } finally {
      clearTimeout(tid)
      loadingMe.value = false
      bootstrapped.value = true
    }
  }

  async function login(username: string, password: string) {
    const res = await fetch(`${apiBase()}/v1/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = (await res.json().catch(() => null)) as Record<string, unknown> | null
    if (!res.ok) {
      const msg = typeof data?.message === 'string' ? data.message : 'Login failed'
      throw new Error(msg)
    }
    const tokens = data as unknown as LoginResponse
    writeStoredAuth({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    })
    hasSession.value = true
    bootstrapped.value = false
    await bootstrap()
  }

  async function logout() {
    try {
      await hiveFetch('/v1/auth/logout', { method: 'POST' })
    } catch {
      /* still clear local session */
    }
    clearStoredAuth()
    me.value = null
    hasSession.value = false
  }

  return {
    me,
    loadingMe,
    bootstrapped,
    isAuthenticated,
    bootstrap,
    login,
    logout,
  }
})
