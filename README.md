# EthioGospel frontend

React + TypeScript + Vite single-page app for the streaming site, including the
public player and the admin console.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Typecheck, then emit a production bundle into `dist/` |
| `npm run typecheck` | `tsc -b` over the app and node projects |
| `npm run lint` | ESLint over the whole source tree |
| `npm test` | Vitest suite in jsdom |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:coverage` | Vitest with coverage |

Run `npm run lint` and `npx eslint . --fix` before pushing; the suite is
expected to be clean.

## Authentication

Login returns an httpOnly cookie named `ydcs_session`. Nothing sensitive is
stored in the browser:

- `frontend/src/player/utils/api.ts` sends `credentials: 'include'` on every request.
- No `Authorization` header is set by the browser client.
- The only `localStorage` entry is `audio_client_id`, a random anonymous
  identifier used for listener identity (likes and listens).

`AuthContext` calls `getMe()` on mount to restore the session and exposes
`isChecking` so the app can hold its splash screen until that check settles.
On logout the context clears in-memory state and the server clears the cookie.

The backend still accepts `Authorization: Bearer` for non-browser clients.

## Configuration

`VITE_API_URL` sets the API base path.

- Local development defaults to `http://localhost:7000/api`.
- Docker builds it with `VITE_API_URL=/api` so the browser and API share an
  origin through the nginx reverse proxy. That keeps the session cookie
  first-party, which is what allows `SameSite=Lax` to work.

For a split deployment, set `VITE_API_URL=https://api.example.com/api` at build
time and add the frontend origin to the backend CORS allowlist in
`backend/src/index.ts`.

Production must be served over HTTPS. The session cookie is marked `secure`
when the backend runs with `NODE_ENV=production`, and browsers drop `secure`
cookies received over plain HTTP, so an HTTP-only production host means nobody
can log in.

## Layout

```
src/
  components/          shared chrome: Nav, Footer, ErrorBoundary, admin console
  i18n.tsx             i18next bootstrap
  i18n/locales/        en / am / om translation data
  lib/apiBase.ts       VITE_API_URL resolution
  player/              the player feature: pages, context, hooks, utils
  shims/              browser stubs for packages with native-only imports
  test/setup.ts       shared jsdom and media-element stubs
```

## Notes

- `jsmediatags` requires `react-native-fs` at module scope. `vite.config.ts`
  aliases it to `src/shims/react-native-fs.ts`; the browser build never uses the
  React Native reader.
- Tailwind runs through the `@tailwindcss/vite` plugin. Keep `@import` rules
  ahead of `@source` in `src/index.css`, otherwise the CSS minifier rejects the
  `source()` function.
- The production bundle emits a chunk-size warning for the main entry. It is
  not an error; code-splitting the routes would address it if bundle size
  becomes a problem.