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

With **`VITE_FLORA_HIVE_URL` empty**, the browser calls same-origin `/v1/...` and Vite proxies those paths to Hive, avoiding CORS during local dev.

## Production build

Set **`VITE_FLORA_HIVE_URL`** to the public Hive origin (no trailing slash). Ensure Hive allows that origin in CORS if the app is hosted on a different domain.

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
