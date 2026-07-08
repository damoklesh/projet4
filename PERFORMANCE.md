# DataShare Performance

This document records the k6 load-test setup and the latest local execution results.

## Test Coverage

The k6 script is located at `perf/k6/datashare-load.js`.

| Scenario | Load | Endpoint | Main metrics |
|---|---:|---|---|
| Login | 100 virtual users | `POST /auth/login` | latency, failed logins |
| Upload | 20 virtual users | `POST /file-assets` | upload duration, failed uploads |
| Download | 50 virtual users | `POST /share-links/{token}/download` | first byte time, bytes downloaded |
| History | 200 virtual users | `GET /me/file-assets` | latency, failed history requests |

The setup phase creates unique test users, authenticates them, and uploads one seed file used by the download scenario.

## How To Run

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

## Latest Result

Status: pending local execution.

I could not collect a k6 report yet because k6 is not installed on this machine. Once k6 is installed and the Docker API is running, run `npm run perf:k6` and paste or commit the console output here.

## Conclusion

The repository now contains repeatable k6 tests for the critical API flows. k6 captures request latency, failures, first-byte timing, and transferred bytes. CPU and memory are infrastructure metrics, so they should be read alongside the k6 run with `docker stats datashare-api datashare-postgres` or the equivalent production monitoring tool.
