# Maintenance

- Keep functional modules isolated: auth, users, file assets, share links, tags, storage, expiration, database.
- Add business rules to services, not controllers or DTOs.
- Keep persistence details in repositories.
- Extend shared API contracts in `packages/shared` when both apps need the same types.
- Keep generated files, uploaded files, and temporary files out of git.
