<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

async function onLogout() {
  await auth.logout()
}
</script>

<template>
  <div class="layout">
    <header v-if="auth.isAuthenticated" class="top">
      <RouterLink to="/environments" class="brand">
        <span class="brand-mark" aria-hidden="true" />
        Flora
      </RouterLink>
      <nav class="nav">
        <RouterLink to="/environments" class="nav-link">Environments</RouterLink>
        <span v-if="auth.me" class="user">{{ auth.me.userver.username }}</span>
        <button type="button" class="logout" @click="onLogout">Log out</button>
      </nav>
    </header>
    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-background-soft);
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.65rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background);
  box-shadow: var(--flora-shadow, 0 1px 3px rgba(0, 0, 0, 0.06));
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.125rem;
  letter-spacing: -0.02em;
  color: var(--color-heading);
  text-decoration: none;
}

.brand-mark {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--flora-sage, #5c7f6a) 0%, var(--flora-moss, #3d5a4a) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.nav {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
  font-size: 0.9rem;
}

.nav-link {
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  color: var(--color-text-mute);
  text-decoration: none;
  font-weight: 500;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}

.nav-link:hover {
  color: var(--color-text);
  background: var(--color-background-mute);
}

.nav-link.router-link-active {
  color: var(--color-accent);
  background: var(--color-accent-soft);
}

.user {
  color: var(--color-text-mute);
  font-size: 0.85rem;
  padding: 0 0.35rem;
}

.logout {
  margin-left: 0.25rem;
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  font: inherit;
  font-size: 0.85rem;
  color: var(--color-text-mute);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    color 0.15s ease,
    background 0.15s ease;
}

.logout:hover {
  border-color: var(--color-border-hover);
  color: var(--color-text);
  background: var(--color-background-soft);
}

.main {
  flex: 1;
  padding: 1.75rem 1.5rem 3rem;
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
}
</style>
