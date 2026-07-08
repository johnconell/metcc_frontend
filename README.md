# Frontend

React + Vite + Tailwind CSS SPA for the Auth CRUD Starter API.

## Setup

```bash
npm install
cp .env.example .env
```

## Run

```bash
npm run dev
```

Open http://localhost:5173

## Default Login

Use seeded credentials from the root README (e.g. `user@example.com` / `password`).

## Cloud Deploy

This app builds to a static SPA in `dist/` and is ready for cloud hosting.

Before deploying, set `VITE_API_URL` to your production API endpoint in the host's environment settings.

For static hosts that need client-side routing fallback, the app includes a Netlify redirect rule in `public/_redirects` so refreshes on routes like `/dashboard` continue to resolve to `index.html`.

Build command:

```bash
npm run build
```
