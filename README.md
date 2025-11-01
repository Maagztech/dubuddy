# Mini Low-Code CRUD + RBAC

This is a minimal prototype that demonstrates:

- Define models via a simple Admin UI
- Persist model definition to `/models/<ModelName>.json`
- Dynamically register CRUD APIs under `/api/<table>`
- Enforce RBAC per-model (Admin/Manager/Viewer) using JWT

How to run

1. Install dependencies:

   npm install

2. Start server (dev):

   npm run dev

The server runs on http://localhost:3000 and serves the admin UI at `/`.

Usage

- Login via the UI using username: `alice` (Admin), `bob` (Manager), or `carol` (Viewer).
- Create a model JSON in the left pane and click Publish (Admin only).
- Once published, the backend writes `/models/<ModelName>.json` and registers `/api/<table>` endpoints.

Notes

- Data is stored as JSON arrays under `/data/<table>.json`.
- The model JSON file is the source-of-truth.
- This prototype focuses on the core flows; extend as needed (DB, migrations, field validation, UI polish).

Prisma + SQLite

This version uses Prisma with a generic `ModelRecord` table to store model data as JSON strings in SQLite. To apply the Prisma schema (creates `prisma/dev.db`) and generate the Prisma client:

1. From project root:

   npm install
   npx prisma db push

Frontend (Vite + React)

A minimal React admin UI is provided under `frontend/`.

To run it:

cd frontend
npm install
npm run dev

The frontend proxies API requests to the backend at http://localhost:3000 in development.
