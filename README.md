# DataShare

DataShare is a full-stack TypeScript monorepo for temporary file upload and public sharing.

## Stack

- Backend: NestJS, Prisma, PostgreSQL, JWT, Swagger/OpenAPI
- Frontend: React, Vite, React Router, Zustand
- Storage: local filesystem for the MVP, behind a storage port for future S3/MinIO adapters
- Quality: ESLint, Prettier, Jest, Vitest, Cypress-ready folders

Binary files are stored on disk under `apps/api/storage/uploads/`. PostgreSQL stores metadata only.

## Launch The Application Locally

### 1. Install prerequisites

Make sure these tools are available:

- Node.js `>=20.19.0`
- npm
- Docker Desktop or Docker Engine with Docker Compose, used for PostgreSQL and for the full Docker runtime

### 2. Install dependencies

From the repository root:

```bash
npm install
```

### 3. Create the environment file

Copy the example file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

For local development, the default `DATABASE_URL` matches the PostgreSQL service from `docker-compose.yml`:

```env
DATABASE_URL="postgresql://datashare:datashare@localhost:5432/datashare?schema=public"
```

### 4. Start PostgreSQL

PostgreSQL is always started with Docker for local development:

```bash
docker compose up -d postgres
```

Optional health check:

```bash
docker compose ps
```

The database is exposed on `localhost:5432` with:

- Database: `datashare`
- User: `datashare`
- Password: `datashare`

### 5. Generate Prisma Client

```bash
npm run api:db:generate
```

### 6. Apply database migrations

```bash
npm run api:db:migrate:dev
```

This creates the DataShare metadata tables in PostgreSQL:

- `users`
- `file_assets`
- `share_links`
- `tags`
- `file_tags`

### 7. Start the backend API

In this mode, PostgreSQL runs in Docker and the API/web apps run directly with Node.js. In one terminal:

```bash
npm run dev -w apps/api
```

The API runs at:

- API: http://localhost:3000
- Swagger/OpenAPI: http://localhost:3000/docs

### 8. Start the frontend

In a second terminal:

```bash
npm run dev -w apps/web
```

The web app runs at:

- Web: http://localhost:5173

### 9. Alternative: start API and web together

After PostgreSQL is running and migrations are applied:

```bash
npm run dev
```

This starts the NestJS API and Vite web app concurrently.

### 10. Stop local services

Stop the app terminals with `Ctrl+C`.

Stop PostgreSQL:

```bash
docker compose down
```

To also remove the local PostgreSQL volume:

```bash
docker compose down -v
```

## Launch With Docker

The compose file can also build and run the complete local stack: PostgreSQL, API and web.

```bash
docker compose up -d --build postgres api web
```

The API image applies Prisma migrations automatically at startup with `prisma migrate deploy`, so no manual migration command is required for this Docker flow.

The services are exposed at:

- Web: http://localhost:5173
- API: http://localhost:3000
- Swagger/OpenAPI: http://localhost:3000/docs

Stop the full Docker stack with:

```bash
docker compose down
```

## Quality

```bash
npm run build
npm run lint
npm run test
npm run test:e2e
```

## Performance Tests

The k6 load-test script is located at:

```text
perf/k6/datashare-load.js
```

Start the API and database first:

```bash
docker compose up -d postgres api
```

Then run:

```bash
npm run perf:k6
```

Optional API target override:

```bash
BASE_URL=http://localhost:3000 npm run perf:k6
```

On Windows PowerShell:

```powershell
$env:BASE_URL="http://localhost:3000"
npm run perf:k6
```

The human-readable performance report is maintained in `docs/PERF.md`.

## CI And AWS Deployment

Continuous integration is defined in `.github/workflows/ci.yaml`. It runs quality checks, API tests, web tests, Cypress E2E tests and a real API E2E flow with Docker Compose.

AWS deployment is documented in:

- `infra/aws/README.md` for the architecture and deployment overview
- `infra/aws/nextSteps.md` for the step-by-step Terraform and ECR commands

Deployment to AWS is currently a documented manual flow, not an automatic GitHub Actions CD pipeline.

## Coverage Generation

Generate lint and unit/integration coverage reports from the repository root:

```bash
npm run reports
```

This runs:

```bash
npm run lint:report
npm run test:coverage
```

Generated reports are written under `reports/`:

- API lint report: `reports/api/lint/eslint.json`
- API coverage report: `reports/api/coverage/index.html`
- API LCOV report: `reports/api/coverage/lcov.info`
- API coverage summary: `reports/api/coverage/coverage-summary.json`
- Web lint report: `reports/web/lint/eslint.json`
- Web coverage report: `reports/web/coverage/index.html`
- Web LCOV report: `reports/web/coverage/lcov.info`
- Web coverage summary: `reports/web/coverage/coverage-summary.json`

To generate only coverage reports:

```bash
npm run test:coverage
```

To generate only lint reports:

```bash
npm run lint:report
```

To generate the Cypress E2E report, start the web app first, then run Cypress reporting:

```bash
npm run dev -w apps/web
npm run test:e2e:report -w apps/web
```

The Cypress JSON report is written to:

```text
reports/web/cypress/cypress.json
```

The `reports/` directory is ignored by Git.

## Database Migrations

Prisma owns the PostgreSQL schema under `apps/api/prisma/schema.prisma`; committed SQL migrations live under `apps/api/prisma/migrations`.

```bash
npm run api:db:generate
npm run api:db:migrate:dev
npm run api:db:migrate:deploy
npm run api:db:reset
npm run api:db:studio
```

No seed data is required for a fresh installation. Create users through the registration screen or `POST /auth/register`.
