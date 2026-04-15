<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

async function onSubmit() {
  error.value = ''
  submitting.value = true
  try {
    await auth.login(username.value.trim(), password.value)
    const redirect =
      typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
        ? route.query.redirect
        : '/environments'
    await router.replace(redirect)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Login failed'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login">
    <h1>Flora</h1>
    <p class="sub">Sign in to Flora Hive</p>
    <form class="card" @submit.prevent="onSubmit">
      <label>
        <span>Username</span>
        <input v-model="username" type="text" name="username" autocomplete="username" required />
      </label>
      <label>
        <span>Password</span>
        <input
          v-model="password"
          type="password"
          name="password"
          autocomplete="current-password"
          required
        />
      </label>
      <p v-if="error" class="err" role="alert">{{ error }}</p>
      <button type="submit" class="primary" :disabled="submitting">
        {{ submitting ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.login {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: linear-gradient(
    160deg,
    var(--login-bg-a) 0%,
    var(--login-bg-b) 45%,
    var(--login-bg-a) 100%
  );
  color: var(--login-text);
}

h1 {
  margin: 0 0 0.25rem;
  font-size: 1.75rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.sub {
  margin: 0 0 1.75rem;
  color: var(--login-text-muted);
  font-size: 0.95rem;
}

.card {
  width: 100%;
  max-width: 22rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 12px;
  background: var(--login-card-bg);
  border: 1px solid var(--login-card-border);
  box-shadow: var(--login-card-shadow);
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: var(--login-label);
}

input {
  padding: 0.55rem 0.65rem;
  border-radius: 8px;
  border: 1px solid var(--login-input-border);
  background: var(--login-input-bg);
  color: var(--login-input-text);
  font-size: 1rem;
}

input:focus {
  outline: 2px solid var(--login-focus-ring);
  outline-offset: 1px;
  border-color: transparent;
}

.primary {
  margin-top: 0.25rem;
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 8px;
  background: var(--login-primary-bg);
  color: var(--login-primary-fg);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
}

.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.err {
  margin: 0;
  font-size: 0.85rem;
  color: var(--login-error);
}
</style>
