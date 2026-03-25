# Notes Next.js Fullstack

Backend-first scaffold for a fullstack notes application built with Next.js App Router, TypeScript, and Prisma.

## Tech Stack

- Next.js 14 (App Router, TypeScript)
- React 18
- Prisma ORM
- SQLite (local development)
- Jest (API-level tests)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the database

This project uses SQLite via Prisma. The default database file is `prisma/dev.db`.

1. Generate the Prisma client and create the initial migration:

```bash
npx prisma migrate dev --name init
```

This will create the SQLite database file and apply the schema defined in `prisma/schema.prisma`.

### 3. Run the development server

```bash
npm run dev
```

Then open http://localhost:3000 in your browser.

### 4. API Endpoints

- `GET /api/notes` – List all notes ordered by `updatedAt` descending.
- `POST /api/notes` – Create a new note.
  - Request body (JSON):
    - `title` (string, required, non-empty)
    - `body` (string, required, non-empty)
- `GET /api/notes/:id` – Fetch a single note by id.
- `DELETE /api/notes/:id` – Delete a note by id.

All endpoints return JSON responses with appropriate HTTP status codes. Validation errors return `400` with a list of error messages.

### 5. Running tests

Tests are written with Jest and exercise the API handlers directly.

```bash
npm test
```

The tests will connect to the Prisma client and operate on the SQLite database. They clean up created notes before and after the test suite.
