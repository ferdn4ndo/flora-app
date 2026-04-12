<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { hiveJson } from '@/lib/api'
import { indexMqttByLogicalDeviceId, presenceLabel } from '@/lib/liveDevices'
import type { DeviceRow, EnvironmentRow, MqttLiveDevice } from '@/types/hive'

const route = useRoute()

const environmentId = computed(() => String(route.params.environmentId ?? ''))

const environment = ref<EnvironmentRow | null>(null)
const devices = ref<DeviceRow[]>([])
const mqttByLogicalDeviceId = ref<Map<string, MqttLiveDevice>>(new Map())
const loading = ref(true)
const error = ref('')

const showAdd = ref(false)
const newDeviceId = ref('')
const newDeviceType = ref('flora_root')
const newDisplayName = ref('')
const addError = ref('')
const adding = ref(false)
const lastRegisteredMqttDeviceId = ref('')
const copyFlash = ref('')

let pollTimer: ReturnType<typeof setInterval> | null = null

const rows = computed(() =>
  devices.value.map((device) => ({
    device,
    live: mqttByLogicalDeviceId.value.get(device.deviceId),
  })),
)

async function loadMqttOnly() {
  try {
    const mqttRes = await hiveJson<{ devices: MqttLiveDevice[] }>(
      '/v1/mqtt/devices?include_offline=true',
    )
    mqttByLogicalDeviceId.value = indexMqttByLogicalDeviceId(mqttRes.devices ?? [])
  } catch {
    /* keep previous map if MQTT unavailable */
  }
}

async function loadAll() {
  const id = environmentId.value
  if (!id) return
  loading.value = true
  error.value = ''
  try {
    const [envData, devData] = await Promise.all([
      hiveJson<EnvironmentRow>(`/v1/environments/${encodeURIComponent(id)}`),
      hiveJson<{ devices: DeviceRow[] }>(
        `/v1/environments/${encodeURIComponent(id)}/devices`,
      ),
    ])
    environment.value = envData
    const list = devData.devices ?? []
    list.sort((a, b) =>
      (a.displayName || a.deviceId).localeCompare(b.displayName || b.deviceId, undefined, {
        sensitivity: 'base',
      }),
    )
    devices.value = list
    await loadMqttOnly()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load environment'
    environment.value = null
    devices.value = []
    mqttByLogicalDeviceId.value = new Map()
  } finally {
    loading.value = false
  }
}

function openAdd() {
  addError.value = ''
  newDeviceId.value = ''
  newDeviceType.value = 'flora_root'
  newDisplayName.value = ''
  showAdd.value = true
}

function cancelAdd() {
  showAdd.value = false
  addError.value = ''
}

async function onAddDevice() {
  addError.value = ''
  const id = environmentId.value
  const deviceId = newDeviceId.value.trim()
  const deviceType = newDeviceType.value.trim()
  if (!deviceId) {
    addError.value = 'Device ID is required'
    return
  }
  if (!deviceType) {
    addError.value = 'Device type is required'
    return
  }
  const dn = newDisplayName.value.trim()
  adding.value = true
  try {
    const created = await hiveJson<DeviceRow>(
      `/v1/environments/${encodeURIComponent(id)}/devices`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceType,
          deviceId,
          displayName: dn.length ? dn : null,
        }),
      },
    )
    lastRegisteredMqttDeviceId.value = created.deviceId
    const next = [...devices.value.filter((d) => d.id !== created.id), created]
    next.sort((a, b) =>
      (a.displayName || a.deviceId).localeCompare(b.displayName || b.deviceId, undefined, {
        sensitivity: 'base',
      }),
    )
    devices.value = next
    showAdd.value = false
    newDeviceId.value = ''
    newDisplayName.value = ''
    await loadMqttOnly()
  } catch (e) {
    addError.value = e instanceof Error ? e.message : 'Could not register device'
  } finally {
    adding.value = false
  }
}

async function copyMqttDeviceId(id: string) {
  try {
    await navigator.clipboard.writeText(id)
    copyFlash.value = id
    window.setTimeout(() => {
      if (copyFlash.value === id) copyFlash.value = ''
    }, 2000)
  } catch {
    copyFlash.value = ''
  }
}

onMounted(() => {
  void loadAll()
  pollTimer = setInterval(() => {
    if (!environmentId.value || loading.value) return
    void loadMqttOnly()
  }, 30_000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

watch(environmentId, () => {
  lastRegisteredMqttDeviceId.value = ''
  void loadAll()
})
</script>

<template>
  <div class="page">
    <nav class="crumb">
      <RouterLink to="/environments">Environments</RouterLink>
      <span class="sep" aria-hidden="true">/</span>
      <span class="current">{{ environment?.name ?? '…' }}</span>
    </nav>

    <header class="head">
      <div class="head-row">
        <div>
          <h1>{{ environment?.name ?? 'Environment' }}</h1>
          <p v-if="environment" class="muted mono env-id">{{ environment.id }}</p>
          <p v-else-if="!loading && !error" class="muted">Unknown environment</p>
        </div>
        <div class="head-actions">
          <button type="button" class="btn-secondary" :disabled="loading || !!error" @click="loadAll">
            Refresh
          </button>
          <button type="button" class="btn-primary" :disabled="loading || !!error" @click="openAdd">
            Add device
          </button>
        </div>
      </div>
    </header>

    <p v-if="lastRegisteredMqttDeviceId" class="banner success" role="status">
      <span
        >Device registered. Use this <strong>device ID</strong> as the first MQTT topic segment:
        <code class="mono">{{ lastRegisteredMqttDeviceId }}</code> (see Flora Hive README).</span
      >
      <button type="button" class="btn-inline" @click="copyMqttDeviceId(lastRegisteredMqttDeviceId)">
        {{ copyFlash === lastRegisteredMqttDeviceId ? 'Copied' : 'Copy id' }}
      </button>
    </p>

    <section v-if="showAdd" class="panel" aria-labelledby="add-dev-title">
      <h2 id="add-dev-title" class="panel-title">Register device</h2>
      <p class="muted hint">
        Hive requires a <strong>device type</strong> and a <strong>device ID</strong> (logical id, often the
        hardware UUID). That same value is the first segment in MQTT topics after the topic prefix.
      </p>
      <form class="form" @submit.prevent="onAddDevice">
        <label class="field">
          <span>Device ID</span>
          <input
            v-model="newDeviceId"
            type="text"
            name="deviceId"
            autocomplete="off"
            placeholder="e.g. device UUID / serial"
            required
          />
        </label>
        <label class="field">
          <span>Device type</span>
          <input v-model="newDeviceType" type="text" name="deviceType" required />
        </label>
        <label class="field">
          <span>Display name <span class="optional">(optional)</span></span>
          <input v-model="newDisplayName" type="text" name="displayName" autocomplete="off" />
        </label>
        <p v-if="addError" class="form-err" role="alert">{{ addError }}</p>
        <div class="form-actions">
          <button type="button" class="btn-secondary" :disabled="adding" @click="cancelAdd">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="adding">
            {{ adding ? 'Registering…' : 'Register' }}
          </button>
        </div>
      </form>
    </section>

    <div v-if="loading" class="state loading" aria-busy="true">
      <span class="spinner" aria-hidden="true" />
      <span>Loading…</span>
    </div>
    <div v-else-if="error" class="state error" role="alert">
      <strong>Could not load</strong>
      <p>{{ error }}</p>
    </div>
    <ul v-else-if="rows.length" class="list">
      <li v-for="{ device: d, live } in rows" :key="d.id" class="item">
        <div class="item-main">
          <span class="title">{{ d.displayName || d.deviceId }}</span>
          <span class="sub mono">Logical id: {{ d.deviceId }}</span>
          <span class="sub mono">Catalog id (MQTT): {{ d.id }}</span>
          <span class="sub">Type: {{ d.deviceType }}</span>
        </div>
        <div class="presence" :class="{ online: live?.connected }">
          <span class="dot" aria-hidden="true" />
          <span>{{ presenceLabel(live) }}</span>
        </div>
        <details v-if="live?.telemetry && typeof live.telemetry === 'object'" class="telemetry">
          <summary>Last MQTT payload</summary>
          <pre class="mono tel-pre">{{ JSON.stringify(live.telemetry, null, 2) }}</pre>
        </details>
      </li>
    </ul>
    <div v-else class="empty">
      <p class="empty-title">No devices in this environment</p>
      <p class="muted">Register one with <strong>Add device</strong>.</p>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 48rem;
}

.crumb {
  font-size: 0.9rem;
  margin-bottom: 1rem;
  color: var(--color-text-mute);
}

.crumb a {
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 500;
}

.crumb a:hover {
  text-decoration: underline;
}

.sep {
  margin: 0 0.35rem;
  opacity: 0.5;
}

.current {
  color: var(--color-text);
}

.head-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.head h1 {
  margin: 0 0 0.25rem;
  font-size: 1.65rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-heading);
}

.env-id {
  font-size: 0.8rem;
  word-break: break-all;
}

.muted {
  margin: 0;
  color: var(--color-text-mute);
  font-size: 0.95rem;
}

.head-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.btn-primary {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 10px;
  background: var(--color-accent);
  color: #0f172a;
  font: inherit;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
}

.btn-primary:hover:not(:disabled) {
  filter: brightness(1.05);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-background);
  font: inherit;
  font-size: 0.9rem;
  color: var(--color-text);
  cursor: pointer;
}

.btn-secondary:hover:not(:disabled) {
  border-color: var(--color-border-hover);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.banner {
  margin: 1rem 0;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  font-size: 0.9rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  justify-content: space-between;
}

.banner.success {
  background: var(--color-accent-soft);
  border: 1px solid var(--color-border);
  color: var(--color-heading);
}

.btn-inline {
  flex-shrink: 0;
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
}

.panel {
  margin: 1.25rem 0;
  padding: 1.25rem 1.35rem;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--flora-card, var(--color-background));
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.panel-title {
  margin: 0 0 0.35rem;
  font-size: 1.05rem;
  font-weight: 600;
}

.hint {
  margin: 0 0 1rem;
  font-size: 0.85rem;
  line-height: 1.45;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: var(--color-text-mute);
}

.field input {
  padding: 0.55rem 0.65rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  font: inherit;
  font-size: 0.95rem;
}

.field input:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: 1px;
  border-color: transparent;
}

.optional {
  font-weight: 400;
  opacity: 0.85;
}

.form-err {
  margin: 0;
  font-size: 0.85rem;
  color: #b91c1c;
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  justify-content: flex-end;
}

.state {
  margin-top: 1.5rem;
  padding: 1.25rem 1.35rem;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
}

.loading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-text-mute);
}

.spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.error strong {
  display: block;
  margin-bottom: 0.35rem;
}

.list {
  list-style: none;
  margin: 1.5rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.item {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.15rem;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--flora-card, var(--color-background));
}

.telemetry {
  flex-basis: 100%;
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: var(--color-text-mute);
}

.tel-pre {
  margin: 0.35rem 0 0;
  padding: 0.5rem 0.65rem;
  max-height: 12rem;
  overflow: auto;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-background-mute, rgba(0, 0, 0, 0.04));
  font-size: 0.72rem;
  line-height: 1.35;
}

.item-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.title {
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-heading);
}

.sub {
  font-size: 0.8rem;
  color: var(--color-text-mute);
}

.mono {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}

.presence {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--color-text-mute);
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  background: var(--color-background-mute);
}

.presence.online {
  color: var(--flora-moss, #3d5a4a);
  background: rgba(14, 165, 233, 0.12);
}

.presence .dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: #94a3b8;
}

.presence.online .dot {
  background: #22c55e;
}

.empty {
  margin-top: 2rem;
  padding: 2rem 1.5rem;
  text-align: center;
  border-radius: 16px;
  border: 1px dashed var(--color-border);
}

.empty-title {
  margin: 0 0 0.5rem;
  font-weight: 600;
  font-size: 1.05rem;
}

@media (prefers-color-scheme: dark) {
  .form-err {
    color: #fca5a5;
  }

  .error {
    border-color: #7f1d1d;
    background: rgba(127, 29, 29, 0.25);
    color: #fecaca;
  }

  .presence.online {
    color: #86efac;
  }
}
</style>
