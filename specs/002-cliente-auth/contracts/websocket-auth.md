# WebSocket Auth Contract (Client Login Integration)

## Scope
Defines how client JWTs from `/api/v1/auth/login` are used to access protected
realtime channels.

## Namespace
- Protected namespace: `/realtime/v1`

## Handshake Requirements
- Client must provide Bearer token via:
  - `handshake.auth.token`, or
  - `Authorization: Bearer <token>` header
- Token must be valid JWT with:
  - correct signature
  - unexpired `exp` (1 hour policy)
  - expected issuer/audience

## Auth Outcomes
- Success:
  - connection established
  - server emits `auth.ready.v1` with `{ ok, role, username }`
  - client can consume protected events according to role/permissions
- Failure:
  - handshake rejected with generic auth error
  - no disclosure of whether username/password or token detail caused failure

## Rate-Limit Interaction
- Login rate-limit is enforced on HTTP login endpoint.
- Realtime handshake itself should not disclose extra auth diagnostics beyond generic
  failure semantics.
