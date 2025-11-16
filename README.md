# Flow Control

Bloodbank reagent inventory workspace combining the Base44 UI with a custom backend and documentation.

## Frontend (Base44-generated app)

```bash
npm install
npm run dev
```

## Backend (`server/`)

```bash
cd server
npm install
npm run dev
```

Scripting:
- `npm run build` – compiles TypeScript to `dist/`
- `npm run start` – runs the compiled server
- `npm run prisma:generate` – regenerates Prisma client

## Structure

- `src/` – Vite + React UI using Base44 SDK placeholders.
- `server/` – Express + Prisma service with `.env.example`.
- `DOCS/` – requirements (chat transcript, flows), CSV sample data, work plan, data dictionary, codex rules.

## Deployment

1. Provision Postgres and set `DATABASE_URL` (see `.env.example`).
2. Run migrations (`npx prisma migrate deploy`).
3. Build and deploy `server/` on your platform of choice (Render, Railway, etc.).
4. Update the frontend to call the new backend endpoints instead of Base44 SDK.
