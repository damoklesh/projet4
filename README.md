# DataShare

DataShare is a full-stack TypeScript monorepo for temporary file upload and public sharing.

## Stack

- Backend: NestJS, Prisma, PostgreSQL, JWT, Swagger/OpenAPI
- Frontend: React, Vite, React Router, Zustand
- Storage: local filesystem for the MVP, behind a storage port for future S3/MinIO adapters
- Quality: ESLint, Prettier, Jest, Vitest, Cypress-ready folders

Binary files are stored on disk under `apps/api/storage/uploads/`. PostgreSQL stores metadata only.

## Install

```bash
npm install
```

Copy `.env.example` to `.env` at the repository root, then adjust secrets and ports as needed.

## Local Database

```bash
docker compose up -d postgres
npm run prisma:generate -w apps/api
npm run prisma:migrate -w apps/api
```

## Development

```bash
npm run dev
```

- API: http://localhost:3000
- Swagger: http://localhost:3000/docs
- Web: http://localhost:5173

## Quality

```bash
npm run build
npm run lint
npm run test
npm run test:e2e
```

The MVP skeleton intentionally keeps business logic light. Controllers, services, repositories, DTOs, shared types, and test folders are in place so implementation can proceed module by module.
