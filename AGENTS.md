  # AGENTS.md — Crackers Kingdom (Vite/RN/Express)

## Repo structure

Three completely independent subdirectories, each with its own config, dependencies, and package manager:

| Directory | What it is | Package manager | Entry point | Dev server |
|-----------|-----------|-----------------|-------------|------------|
| `client/` | Customer storefront SPA (Vite + React 19) | `pnpm` | `src/main.tsx` | `pnpm dev` → port **5173** |
| `server/` | Express + Drizzle ORM + PostgreSQL API | `pnpm` | `src/server.ts` | `pnpm dev` → port **3000** |
| `Admin/` | Admin panel (React Native CLI 0.83 + Web) | `npm` | `index.js` / `App.tsx` | `npm run web` → port **5000** |

- **No root package.json, no monorepo workspace config, no CI workflows.** Services are independent.
- TypeScript checked per-directory (each has its own `tsconfig.json`).

## Setup

```bash
cd client && pnpm install
cd server && pnpm install
cd Admin && npm install
```

## Key developer commands

### client
- `pnpm dev` — start Vite dev server (proxies `/api` and `/uploads` → server)
- `pnpm build` — runs `tsc -b` then `vite build` (type-check must pass first)
- `pnpm test` — Vitest (jsdom env). Single file: `pnpm test -- src/path/file.test.ts`
- `pnpm lint` — ESLint v9 flat config

### server
- `pnpm dev` — `tsx --watch src/server.ts` (auto-restart on changes)
- `pnpm build` — `tsc` outputs ESM to `dist/`. Start via `pnpm start`
- DB: `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:push`, `pnpm db:studio`, `pnpm db:seed`
- Use `pnpm db:push` to sync schema without migration files; use `db:migrate` for production

### Admin
- `npm run web` — start Webpack dev server (port 5000) for the web target
- `npm run android` / `npm run ios` — native mobile via Metro
- `npm run build` — Webpack production build to `Admin/dist/`
- `npm test` — Jest (uses `react-native` preset)
- `npm run lint` — ESLint (extends `@react-native`)
- **Uses `patch-package`** via `postinstall` — run `npm run postinstall` if `node_modules` diverge

## Architecture notes

- **Admin is dual-platform**: compiles to web via Webpack + React Native Web, and to native via Metro. Web shims for RN-native modules live in `Admin/src/shims/`. Webpack aliases `react-native` → `react-native-web` and shims native-only packages.
- **Admin API URL** is hardcoded in `Admin/src/utils/constants.ts` (not env-file based). Uses `Platform.OS` to decide Android vs iOS/web address.
- **Server is ESM** (`"type": "module"`). All imports use `.js` extension in source for ESM compliance.
- **client Tailwind**: Tailwind v4 via `@tailwindcss/vite` plugin (NOT PostCSS config). CSS is in `src/index.css`.
- **Admin Tailwind**: Tailwind v3 via NativeWind v4 with PostCSS. Uses `global.css` for imports.
- **Vite proxy** in `client/vite.config.ts` forwards `/api` and `/uploads` to the backend, so client dev doesn't need separate CORS config.
- Vite uses `@` alias → `./src`; Admin has no path alias.

## Testing quirks

- Admin tests go in `Admin/__tests__/` (not inside `src/`). Jest preset: `react-native`.
- Client tests are co-located or in `src/test/`. Vitest config uses jsdom, `@/` resolve alias, and `src/test/setup.ts` (provides `matchMedia` mock).
- Server has no test framework configured.

## Conventions

- `@typescript-eslint/no-unused-vars` is **off** in client (eslint.config.js).
- Admin Prettier: single quotes, trailing commas, avoid parens on single arrow param.
- Client formatter is not explicitly configured; ESLint is the only linter.
