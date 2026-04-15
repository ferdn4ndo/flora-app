# Flora App — agent notes

Vue **3** + **Vite** + **TypeScript** SPA for **[Flora Hive](https://github.com/ferdn4ndo/flora-hive)** (JSON HTTP API). **Pinia** + **Vue Router 5**. No component library; views use scoped CSS.

## Run / quality

- `npm run dev` — Vite dev server (`host: true` for WSL2).
- `npm run build` — type-check + production bundle.
- `npm run type-check` — `vue-tsc`.
- `npm run lint` — oxlint then ESLint (`--fix`).
- Node: `^20.19.0 || >=22.12.0` (see `package.json`).

## API & environment

- **`VITE_FLORA_HIVE_URL`** — Empty in dev: browser hits same-origin `/v1/...`, **Vite proxies** `/v1` and `/healthz` to **`VITE_DEV_FLORA_HIVE_PROXY_TARGET`** (default `http://localhost:8080`). Non-empty in prod: full Hive origin, no trailing slash.
- **`hiveFetch` / `hiveJson`** (`src/lib/api.ts`) — `credentials: 'include'`, Bearer from `localStorage` unless `Authorization` already set. **401** → single-flight **`/v1/auth/refresh`**, then retry; failure clears auth.
- **`apiBase()`** — exported; used for login URL (see below).

## Auth

- Tokens in **`localStorage`** under **`flora_hive_auth`** (`AUTH_STORAGE_KEY` in `src/lib/constants.ts`); shape `{ access_token, refresh_token }` (`src/lib/authStorage.ts`).
- **`login`** (`stores/auth.ts`) uses **`fetch(`${apiBase()}/v1/auth/login`, …)`** (not `hiveJson`) — same body/credentials pattern.
- **`bootstrap`** — if access token exists, **`GET /v1/auth/me`** (12s abort); on failure clears storage. Router **`beforeEach`** awaits bootstrap once (`bootstrapped`); **mount only after `router.isReady()`** (`main.ts`) so the first navigation is not blank.
- **`logout`** — `POST /v1/auth/logout` via `hiveFetch`, then clear storage.

## Router

- **`createWebHashHistory`** — URLs use `#/…`.
- Routes: `/` → environments; **`/login`** (`meta.public`); **`/environments`** and **`/environments/:environmentId`** (`requiresAuth`). Unauthenticated → login with `query.redirect`; logged-in hitting login → environments.

## Domain usage in UI

- **Environments** — `GET /v1/environments`, `POST /v1/environments` (`EnvironmentsView.vue`).
- **Environment detail** — `GET /v1/environments/:id`, `GET …/devices`, **`POST …/devices`** (register: `deviceType`, `deviceId`, optional `displayName`), **`PATCH …/devices/:deviceId`** where **`:deviceId` is the logical MQTT id** (`deviceRow.deviceId`), body e.g. `{ displayName }` for rename. **`GET /v1/mqtt/devices?include_offline=true`** for live map; join on **`MqttLiveDevice.id` === catalog `deviceId`** (`src/lib/liveDevices.ts`).
- Types for API shapes: **`src/types/hive.ts`**.

## Styling

- Global tokens: **`src/assets/colors.css`** (palette `--flora-*`, semantics `--color-*`, login `--login-*`, shadows, errors, presence). **`src/assets/base.css`** imports colors then reset/body. **`src/assets/main.css`** imports `base.css` only. Prefer **`var(--color-…)`** / **`var(--flora-…)`** in components instead of raw hex.

## Conventions

- Path alias **`@/`** → `src/`.
- Hive errors: `hiveJson` throws **`Error`** with API **`message`** when present.

## Out of scope in repo

- No automated tests. Hive OpenAPI contract not checked in-repo; behavior matches Flora Hive routes described in Hive README / source.
