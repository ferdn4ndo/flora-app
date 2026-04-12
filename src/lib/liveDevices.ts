import type { MqttLiveDevice } from '@/types/hive'

/** Map logical `devices.device_id` (Hive `MqttLiveDevice.id`) → latest MQTT presence. */
export function indexMqttByLogicalDeviceId(devices: MqttLiveDevice[]): Map<string, MqttLiveDevice> {
  const m = new Map<string, MqttLiveDevice>()
  for (const d of devices) {
    const key = d.id
    const prev = m.get(key)
    if (!prev || new Date(d.lastSeenAt).getTime() > new Date(prev.lastSeenAt).getTime()) {
      m.set(key, d)
    }
  }
  return m
}

export function formatRelativeTime(iso: string): string {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return iso
  const sec = Math.round((Date.now() - t) / 1000)
  if (sec < 45) return 'just now'
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`
  if (sec < 86_400) return `${Math.floor(sec / 3600)} h ago`
  if (sec < 86_400 * 7) return `${Math.floor(sec / 86_400)} d ago`
  return new Date(iso).toLocaleString()
}

export function presenceLabel(live: MqttLiveDevice | undefined): string {
  if (!live) return 'No telemetry yet'
  const rel = formatRelativeTime(live.lastSeenAt)
  if (live.connected) return `Online · ${rel}`
  return `Offline · last seen ${rel}`
}
