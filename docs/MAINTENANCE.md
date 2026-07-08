# Maintenance

- Keep functional modules isolated: auth, users, file assets, share links, tags, storage, expiration, database.
- Add business rules to services, not controllers or DTOs.
- Keep persistence details in repositories.
- Extend shared API contracts in `packages/shared` when both apps need the same types.
- Keep generated files, uploaded files, and temporary files out of git.

## Database migrations

DataShare uses Prisma for PostgreSQL schema versioning and client generation. Binary file contents must stay on filesystem storage; Prisma models store metadata only.

Run these commands from the repository root:

- `npm run api:db:generate` generates Prisma Client.
- `npm run api:db:migrate:dev` creates/applies a local development migration.
- `npm run api:db:migrate:deploy` applies committed migrations in deployed environments.
- `npm run api:db:reset` resets the local database and reapplies migrations.
- `npm run api:db:studio` opens Prisma Studio.
