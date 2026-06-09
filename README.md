# APK Store

Lightweight public APK store with admin-only release management. The frontend is
a React/Vite app, and the backend is a Fastify API with SQLite metadata,
backend-managed APK files, SHA-256 checksums, and HTTP-only admin sessions.

## Features

- Public catalog with search, category filters, app details, release history, and APK downloads.
- Admin dashboard for app metadata, APK uploads, publish/draft controls, and release deletion.
- SQLite database plus APK files stored under a persistent data directory.
- Docker Compose deployment with Caddy reverse proxy.

## Local Development

Use Node.js 24 LTS. The repo includes `.nvmrc` and `.node-version`, and the
Docker image uses Node 24.

If you use `nvm`:

```bash
nvm install
nvm use
```

Install and run the two packages separately:

```bash
cd server
npm install
ADMIN_PASSWORD=admin123 SESSION_SECRET=dev-secret npm run dev
```

```bash
cd web
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to `http://localhost:8080`, so keep
the backend running while using the frontend. If your API is on another host,
set `VITE_API_URL` in `web/.env.local`.

If the server reports that `better-sqlite3` was compiled against a different
Node.js version, rebuild the native SQLite module under your current Node:

```bash
cd server
npm run rebuild:sqlite
```

This can happen after switching Node versions because SQLite is a native addon.
Make sure `server/package-lock.json` resolves `better-sqlite3` to `12.10.0`
or newer before reinstalling.

## Production Deployment

Copy `.env.example` to `.env`, set strong values, then start the stack:

```bash
docker compose up --build -d
```

Persistent data lives in the `apk_store_data` Docker volume. Back up this volume
regularly because it contains both `store.db` and uploaded APK files.

For a real domain, replace `:80` in `Caddyfile` with your hostname, for example:

```caddyfile
apk.example.com {
  reverse_proxy app:8080
}
```

## API Overview

Public:

- `GET /api/health`
- `GET /api/apps`
- `GET /api/apps/:slug`
- `GET /api/apps/:slug/releases`
- `GET /api/releases/:id/download`

Admin:

- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/me`
- `GET /api/admin/apps`
- `POST /api/admin/apps`
- `PATCH /api/admin/apps/:id`
- `POST /api/admin/apps/:id/releases`
- `PATCH /api/admin/releases/:id`
- `DELETE /api/admin/releases/:id`
