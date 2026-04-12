<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { hiveJson } from '@/lib/api'
import type { EnvironmentRow } from '@/types/hive'

const environments = ref<EnvironmentRow[]>([])
const error = ref('')
const loading = ref(true)

const showCreate = ref(false)
const newName = ref('')
const newDescription = ref('')
const createError = ref('')
const creating = ref(false)

async function loadEnvironments() {
  error.value = ''
  const res = await hiveJson<{ environments: EnvironmentRow[] }>('/v1/environments')
  const list = res.environments ?? []
  list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  environments.value = list
}

onMounted(async () => {
  try {
    await loadEnvironments()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load environments'
  } finally {
    loading.value = false
  }
})

function openCreate() {
  createError.value = ''
  newName.value = ''
  newDescription.value = ''
  showCreate.value = true
}

function cancelCreate() {
  showCreate.value = false
  createError.value = ''
}

async function onCreate() {
  createError.value = ''
  const name = newName.value.trim()
  if (!name) {
    createError.value = 'Name is required'
    return
  }
  const description = newDescription.value.trim()
  creating.value = true
  try {
    const created = await hiveJson<EnvironmentRow>('/v1/environments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description: description.length ? description : null,
      }),
    })
    const withRole: EnvironmentRow = { ...created, role: created.role ?? 'editor' }
    const next = [...environments.value.filter((e) => e.id !== withRole.id), withRole]
    next.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
    environments.value = next
    showCreate.value = false
    newName.value = ''
    newDescription.value = ''
  } catch (e) {
    createError.value = e instanceof Error ? e.message : 'Could not create environment'
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div class="page">
    <header class="head">
      <div class="head-row">
        <div>
          <h1>Environments</h1>
          <p class="muted">Spaces where your Flora devices are grouped.</p>
        </div>
        <button type="button" class="btn-primary" :disabled="loading || !!error" @click="openCreate">
          Add environment
        </button>
      </div>
    </header>

    <section v-if="showCreate" class="create-panel" aria-labelledby="create-env-title">
      <h2 id="create-env-title" class="create-title">New environment</h2>
      <p class="muted create-hint">
        Creates a space in Flora Hive and makes you an <strong>editor</strong> (same as
        <code class="mono">POST /v1/environments</code>).
      </p>
      <form class="create-form" @submit.prevent="onCreate">
        <label class="field">
          <span>Name</span>
          <input v-model="newName" type="text" name="name" autocomplete="off" required />
        </label>
        <label class="field">
          <span>Description <span class="optional">(optional)</span></span>
          <textarea v-model="newDescription" name="description" rows="2" />
        </label>
        <p v-if="createError" class="form-err" role="alert">{{ createError }}</p>
        <div class="form-actions">
          <button type="button" class="btn-secondary" :disabled="creating" @click="cancelCreate">
            Cancel
          </button>
          <button type="submit" class="btn-primary" :disabled="creating">
            {{ creating ? 'Creating…' : 'Create' }}
          </button>
        </div>
      </form>
    </section>

    <div v-if="loading" class="state loading" aria-busy="true">
      <span class="spinner" aria-hidden="true" />
      <span>Loading environments…</span>
    </div>
    <div v-else-if="error" class="state error" role="alert">
      <strong>Could not load list</strong>
      <p>{{ error }}</p>
    </div>
    <ul v-else-if="environments.length" class="list">
      <li v-for="env in environments" :key="env.id" class="item">
        <RouterLink
          class="item-link"
          :to="{ name: 'environment', params: { environmentId: env.id } }"
        >
          <div class="item-main">
            <span class="name">{{ env.name }}</span>
            <span v-if="env.description" class="desc">{{ env.description }}</span>
            <span class="id mono">{{ env.id }}</span>
          </div>
          <span class="go" aria-hidden="true">→</span>
        </RouterLink>
        <span v-if="env.role" class="role">{{ env.role }}</span>
      </li>
    </ul>
    <div v-else class="empty">
      <p class="empty-title">No environments yet</p>
      <p class="muted">Use <strong>Add environment</strong> above or the Hive API.</p>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 44rem;
}

.head-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.head h1 {
  margin: 0 0 0.35rem;
  font-size: 1.65rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-heading);
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
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
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
  background: var(--color-background-soft);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.create-panel {
  margin-top: 1.25rem;
  padding: 1.25rem 1.35rem;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--flora-card, var(--color-background));
  box-shadow: var(--flora-shadow, 0 1px 3px rgba(0, 0, 0, 0.06));
}

.create-title {
  margin: 0 0 0.35rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-heading);
}

.create-hint {
  margin: 0 0 1rem;
  font-size: 0.85rem;
}

.create-hint code {
  font-size: 0.8rem;
}

.create-form {
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

.field input,
.field textarea {
  padding: 0.55rem 0.65rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  font: inherit;
  font-size: 0.95rem;
}

.field textarea {
  resize: vertical;
  min-height: 3rem;
}

.field input:focus,
.field textarea:focus {
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

@media (prefers-color-scheme: dark) {
  .form-err {
    color: #fca5a5;
  }
}

.muted {
  margin: 0;
  color: var(--color-text-mute);
  font-size: 0.95rem;
  line-height: 1.5;
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
  font-size: 0.95rem;
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
  font-size: 0.9rem;
}

.error p {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.95;
}

@media (prefers-color-scheme: dark) {
  .error {
    border-color: #7f1d1d;
    background: rgba(127, 29, 29, 0.25);
    color: #fecaca;
  }
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
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 0;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--flora-card, var(--color-background));
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.03);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  overflow: hidden;
}

.item-link {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 0 1rem 1.15rem;
  text-decoration: none;
  color: inherit;
}

.go {
  flex-shrink: 0;
  padding: 0 1rem;
  font-size: 1.1rem;
  color: var(--color-text-mute);
  opacity: 0.65;
}

.item .role {
  margin: 1rem 1.15rem 0 0;
}

@media (hover: hover) {
  .item:hover {
    border-color: var(--color-border-hover);
    box-shadow: var(--flora-shadow, 0 4px 14px rgba(0, 0, 0, 0.06));
  }

  .item-link:hover .name {
    color: var(--color-accent);
  }

  .item-link:hover .go {
    opacity: 1;
    color: var(--color-accent);
  }
}

.item-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.name {
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-heading);
}

.desc {
  font-size: 0.88rem;
  color: var(--color-text-mute);
  line-height: 1.4;
}

.role {
  flex-shrink: 0;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-mute);
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  background: var(--color-background-mute);
}

.id {
  font-size: 0.8rem;
  color: var(--color-text-mute);
  word-break: break-all;
}

.mono {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-weight: 500;
}

.empty {
  margin-top: 2rem;
  padding: 2rem 1.5rem;
  text-align: center;
  border-radius: 16px;
  border: 1px dashed var(--color-border);
  background: var(--color-background);
}

.empty-title {
  margin: 0 0 0.5rem;
  font-weight: 600;
  font-size: 1.05rem;
  color: var(--color-heading);
}
</style>
