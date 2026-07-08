# Performance

- Upload and download paths are designed for streaming.
- The database stores metadata only, keeping large binaries out of PostgreSQL.
- History endpoints should be paginated and indexed by owner, upload date, expiry date, size, and tag joins as usage grows.
- Local filesystem storage is the MVP adapter; S3/MinIO can replace it behind the storage port.
