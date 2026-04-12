import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Async `beforeEach` (e.g. auth bootstrap) means the first navigation is a microtask.
// Mounting before the router is ready leaves `<RouterView />` empty → blank page.
void router.isReady().then(() => {
  app.mount('#app')
})
