# Quickstart: Refactor Backend API for Conveyor System

## 1. Prerequisites
- Node.js 20+
- Docker and Docker Compose
- PostgreSQL (local or containerized)

## 2. Environment Setup
1. Copy environment example and configure secrets.
2. Ensure JWT-related variables and PostgreSQL connection values are set.
3. Keep `AUTO_MIGRATE` enabled for local initialization unless running managed migrations.

## 3. Install Dependencies
```bash
npm install
```

## 4. Run Local Stack
Option A: Direct node runtime
```bash
npm run dev
```

Option B: Containerized runtime (recommended for parity)
```bash
docker compose up --build
```

## 5. Validate Health and API Surface
1. Check health endpoint:
```bash
curl -i http://localhost:1200/api/v1/health
```
2. Open Swagger docs in browser (target path defined by implementation, expected under `/api/v1/docs`).
3. Verify REST auth behavior:
   - Request protected endpoint without token returns unauthorized response.
   - Request with token and proper role succeeds.

## 6. Validate Realtime Behavior
1. Connect websocket client with auth token.
2. Confirm initial snapshot event is received at connect.
3. Trigger critical operation (checkpoint registration) via REST.
4. Validate critical event ack flow and bounded retry behavior.
5. Validate informative event arrives best-effort.

## 7. Run Test Suites
```bash
npm test
```

Expected suites:
- Unit: domain/application service logic
- Integration: REST + PostgreSQL behavior
- Integration: Socket.IO flows with auth and ack/retry verification
- Contract checks: OpenAPI and websocket event contract consistency

## 8. Migration Rollout (Strangler)
1. Enable versioned routes/events (`/api/v1`, `*.v1`) for first migrated domain.
2. Keep legacy route/event compatibility enabled during defined window.
3. Monitor logs and error rates for migrated domain.
4. Deprecate and remove legacy interfaces only after acceptance criteria are met.

## 9. Troubleshooting
- If websocket auth fails, verify JWT issuer/audience and token placement in handshake auth payload.
- If migrations fail, run `npm run migrate` manually and inspect `schema_migrations` contents.
- If legacy and v1 conflict during rollout, temporarily disable one side with `ENABLE_V1_API` or `ENABLE_LEGACY_API`.
