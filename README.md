# Personal Website Deployment Upgrade

This workspace now matches the stack you were considering for [AI-Developer-Website](https://github.com/AmirrezaKha/AI-Developer-Website):

- `frontend/` -> React + Vite for Vercel
- `backend/` -> Express API for Render
- `Neon` -> PostgreSQL via `DATABASE_URL`

## What improved

The original project was a solid prototype, but it was still tied to local development:

- The frontend and admin panel both used hardcoded `localhost` API URLs.
- The backend used a local SQLite file, which is not a good fit for Render's ephemeral filesystem.
- There was no production-ready structure for GitHub, Vercel, and Render.

This version fixes those blockers.

## Project structure

```text
.
|- frontend/
|  |- public/admin.html
|  |- public/admin-shell.html
|  |- src/App.jsx
|  |- src/AdminPage.jsx
|  |- src/main.jsx
|  |- package.json
|  |- vercel.json
|  |- vite.config.js
|  `- .env.example
|- backend/
|  |- server.js
|  |- package.json
|  `- .env.example
|- render.yaml
`- .gitignore
```

## Local development

### Backend

Create `backend/.env` from `backend/.env.example` and add your Neon connection string.

```bash
cd backend
npm install
npm run dev
```

The API runs on `http://localhost:4000`.

### Frontend

Create `frontend/.env` from `frontend/.env.example`.

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Deploying

### Vercel for the React frontend

1. Push this repo to GitHub.
2. In Vercel, import the repository.
3. Set the project root to `frontend`.
4. Add environment variable `VITE_API_URL=https://your-render-service.onrender.com/api`.
5. Deploy.

### Render for the Node.js API

1. In Neon, create a Postgres database.
2. Copy the pooled connection string.
3. In Render, create a new Web Service from GitHub.
4. Set the root directory to `backend`.
5. Build command: `npm install`
6. Start command: `npm start`
7. Add these environment variables:
   - `DATABASE_URL=<your-neon-connection-string>`
   - `ADMIN_TOKEN=<long-random-secret>`
   - `CORS_ORIGIN=https://your-vercel-domain.vercel.app`

You can also use `render.yaml` as a starting blueprint.

### Neon for PostgreSQL

Use the Neon connection string as `DATABASE_URL`. The backend creates tables automatically on first start and seeds starter content if the database is empty.

## Admin panel

The admin panel now lives at `/admin` on the frontend deployment.

It now supports:

- local default API: `http://localhost:4000/api`
- hosted default API: `https://your-render-service.onrender.com/api`
- override with a query string like `/admin?api=https://your-render-service.onrender.com/api`

`/admin.html` still works as a redirect, and the selected API URL is saved in local storage.

## Best next improvements

1. Add authentication around the new `/admin` route instead of relying only on the backend token.
2. Add rate limiting and validation for `/api/contact`.
3. Add a migration tool like Prisma, Drizzle, or Knex.
4. Replace the shared admin token with a proper login flow.
5. Add GitHub Actions for CI and deploy checks.

## Source snapshot

The original source notes are kept in `README.source.md`.
