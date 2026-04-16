import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { hiveJson } from '@/lib/api'
import { clearStoredAuth } from '@/lib/authStorage'

describe('hiveJson', () => {
  beforeEach(() => {
    clearStoredAuth()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('parses a successful JSON body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ hello: 'world' }), { status: 200 })),
    )
    await expect(hiveJson<{ hello: string }>('/v1/example')).resolves.toEqual({ hello: 'world' })
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe('/v1/example')
  })

  it('throws with the API message when present', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Device not found' }), { status: 404 }),
      ),
    )
    await expect(hiveJson('/v1/missing')).rejects.toThrow('Device not found')
  })

  it('throws a generic message when the body has no message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })))
    await expect(hiveJson('/v1/boom')).rejects.toThrow('request failed (500)')
  })
})
