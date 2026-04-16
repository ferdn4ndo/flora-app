import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  formatRelativeTime,
  indexMqttByLogicalDeviceId,
  presenceLabel,
} from '@/lib/liveDevices'
import type { MqttLiveDevice } from '@/types/hive'

function device(partial: Partial<MqttLiveDevice> & Pick<MqttLiveDevice, 'id'>): MqttLiveDevice {
  return {
    connected: false,
    lastSeenAt: '2025-06-01T12:00:00.000Z',
    lastTopic: 'flora/x/heartbeat',
    ...partial,
  }
}

describe('indexMqttByLogicalDeviceId', () => {
  it('returns empty map for empty input', () => {
    expect(indexMqttByLogicalDeviceId([]).size).toBe(0)
  })

  it('indexes by logical id', () => {
    const a = device({ id: 'dev-a', lastSeenAt: '2025-01-01T00:00:00Z' })
    const b = device({ id: 'dev-b', lastSeenAt: '2025-01-02T00:00:00Z' })
    const m = indexMqttByLogicalDeviceId([a, b])
    expect(m.get('dev-a')).toEqual(a)
    expect(m.get('dev-b')).toEqual(b)
  })

  it('keeps the row with the latest lastSeenAt per id', () => {
    const older = device({ id: 'same', lastSeenAt: '2024-01-01T00:00:00Z' })
    const newer = device({ id: 'same', lastSeenAt: '2025-01-01T00:00:00Z' })
    expect(indexMqttByLogicalDeviceId([older, newer]).get('same')).toEqual(newer)
    expect(indexMqttByLogicalDeviceId([newer, older]).get('same')).toEqual(newer)
  })
})

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-15T14:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the raw string when the timestamp is invalid', () => {
    expect(formatRelativeTime('not-a-date')).toBe('not-a-date')
  })

  it('formats very recent timestamps', () => {
    expect(formatRelativeTime('2025-06-15T13:59:40.000Z')).toBe('just now')
  })

  it('formats minutes ago', () => {
    expect(formatRelativeTime('2025-06-15T13:55:00.000Z')).toBe('5 min ago')
  })

  it('formats hours ago', () => {
    expect(formatRelativeTime('2025-06-15T10:00:00.000Z')).toBe('4 h ago')
  })

  it('formats days ago', () => {
    expect(formatRelativeTime('2025-06-10T14:00:00.000Z')).toBe('5 d ago')
  })
})

describe('presenceLabel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-15T14:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('handles missing live device', () => {
    expect(presenceLabel(undefined)).toBe('No telemetry yet')
  })

  it('describes an online device', () => {
    const live = device({
      id: 'x',
      connected: true,
      lastSeenAt: '2025-06-15T13:59:50.000Z',
    })
    expect(presenceLabel(live)).toMatch(/^Online · just now$/)
  })

  it('describes an offline device', () => {
    const live = device({
      id: 'x',
      connected: false,
      lastSeenAt: '2025-06-15T12:00:00.000Z',
    })
    expect(presenceLabel(live)).toMatch(/^Offline · last seen 2 h ago$/)
  })
})
