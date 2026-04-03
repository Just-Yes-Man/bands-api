# Quickstart: Registro y Login de Clientes

## 1. Prerequisites
- Node.js 20+
- Docker + Docker Compose
- PostgreSQL available (local or containerized)

## 2. Environment
1. Ensure `.env` is configured with PostgreSQL and JWT values.
2. Confirm JWT expiration is set to 1 hour (`JWT_EXPIRES_IN=1h`).
3. Keep `AUTO_MIGRATE=true` for local schema updates if migrations are required.

## 3. Install and Start
```bash
npm install
npm run dev
```

Container option:
```bash
docker compose up --build
```

## 4. Verify Register Flow
1. Call register endpoint with valid payload.
2. Confirm success response and DB persistence in `clientes`.
3. Retry with same `nombre` and confirm conflict response.

## 5. Verify Login Flow
1. Call login with correct credentials and confirm JWT issuance.
2. Validate token expiration claim equals 1 hour policy.
3. Call login with wrong credentials and verify generic auth failure message.

## 6. Verify Security Controls
1. Send weak password on register and confirm validation rejection.
2. Trigger repeated login failures and confirm rate-limit behavior.
3. Access protected REST route without token and confirm unauthorized response.
4. Connect to protected websocket namespace without token and confirm rejection.

## 7. Verify Documentation
1. Open Swagger endpoint and confirm register/login contracts are documented.
2. Validate documented responses include success and generic failure shapes.

## 8. Tests
```bash
npm test
```

Auth-focused suites:
```bash
npm run test:auth
```

## 9. Auth Performance and Security Evidence
- Update `specs/002-cliente-auth/perf/auth-latency-report.md` after running register/login latency sampling.
- Update `specs/002-cliente-auth/perf/auth-security-report.md` with rate-limit and generic-error response evidence.
- Record Docker validation evidence for auth startup and protected route/socket checks.

Validation evidence captured on 2026-04-01:
- `docker compose up --build -d` completed successfully.
- `GET /api/v1/health` returned `200` in dockerized runtime.
- `POST /api/v1/auth/register` and `POST /api/v1/auth/login` returned successful auth responses.
- `GET /api/v1/protected/me` with bearer token returned `200` and client identity.
- WebSocket `/realtime/v1` with valid token emitted `auth.ready.v1`.

Expected test coverage for this feature:
- Unit: password policy and token issuance
- Contract: register/login request/response envelopes
- Integration: DB persistence, rate limiting, protected-route auth
