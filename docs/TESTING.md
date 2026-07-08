# Testing

## Backend

- Unit tests: Jest tests under `apps/api/test/unit`.
- Integration tests: Jest + Supertest tests under `apps/api/test/integration`.
- Prepared scenarios: auth register/login, upload, history, delete file, share metadata, download with and without password, expired link, unauthorized access.

## Frontend

- Unit and smoke tests: Vitest + React Testing Library under `apps/web/src/**/*.test.tsx`.
- Store tests: Zustand stores can be tested with Vitest by resetting store state between tests.
- API tests: mock `fetch` around `services/http-client.ts`.
- E2E: Cypress specs are prepared under `apps/web/cypress/e2e`.
