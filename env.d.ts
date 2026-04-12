/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Empty in dev when using Vite proxy; full origin in production (e.g. https://hive.example.com) */
  readonly VITE_FLORA_HIVE_URL: string
  /** Dev-only: where `/v1` and `/healthz` are proxied (default http://localhost:8080) */
  readonly VITE_DEV_FLORA_HIVE_PROXY_TARGET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
