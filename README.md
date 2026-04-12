# Flora App

Vue 3 + Vite + TypeScript SPA for **[Flora Hive](https://github.com/ferdn4ndo/flora-hive)** (or your fork): sign in against Hive’s `/v1/auth/*` routes and browse environments you belong to.

## Setup

```sh
npm install
cp .env.example .env
```

## Development

1. Run [Flora Hive](https://github.com/ferdn4ndo/flora-hive) (default `http://localhost:8080` in `.env.example`), or point `VITE_DEV_FLORA_HIVE_PROXY_TARGET` at your API.
2. Start the UI:

```sh
npm run dev
```

With **`VITE_FLORA_HIVE_URL` empty**, the browser calls same-origin `/v1/...` and Vite proxies those paths to Hive, so the browser does not run CORS for those requests.

## Production build

Set **`VITE_FLORA_HIVE_URL`** to the public Hive origin (no trailing slash).

### CORS (cross-origin app vs Hive)

Flora Hive enables **credentialed CORS** (`Access-Control-Allow-Credentials: true` and a concrete `Access-Control-Allow-Origin`, not `*`). The app sends **`credentials: 'include'`** on Hive requests so browsers accept that response (see `src/lib/api.ts`).

On the Hive side, set **`CORS_ALLOWED_ORIGINS`** to the full **`Origin`** of this SPA (scheme + host + port if non-default), e.g. `https://app.example.com`. Use a comma-separated list for several frontends. If it is unset, Hive allows any origin, which is convenient for dev but loose for production.

```sh
npm run build
npm run preview
```

## Scripts

| Script            | Purpose        |
| ----------------- | -------------- |
| `npm run dev`     | Vite dev server |
| `npm run build`   | Production bundle |
| `npm run preview` | Serve production build |
| `npm run type-check` | `vue-tsc`     |
| `npm run lint`    | ESLint + oxlint |

## Recommended IDE

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar).
