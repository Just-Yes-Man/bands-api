# Research: Registro y Login de Clientes

## Decision 1: Session Strategy
- Decision: Use access-token-only JWT sessions with 1-hour expiration.
- Rationale: Explicitly selected in clarification; keeps implementation simple while enforcing short-lived access.
- Alternatives considered: Refresh-token flow was rejected for this increment; server-side session store was rejected due to architectural divergence.

## Decision 2: Password Security
- Decision: Enforce minimum password policy (8 chars + at least 1 number) and store only hashed passwords.
- Rationale: Meets baseline security requirements without high UX friction.
- Alternatives considered: 6-char minimum rejected as too weak; high-complexity 12-char policy deferred for future hardening.

## Decision 3: Login Abuse Protection
- Decision: Implement rate limiting by client identifier and source IP in login flow.
- Rationale: Reduces brute-force risk without permanent account lock complexity.
- Alternatives considered: No limit rejected for security risk; permanent lock deferred to avoid support overhead in v1.

## Decision 4: Error Disclosure Policy
- Decision: Return one generic login failure message for all auth failures.
- Rationale: Prevents username enumeration and sensitive feedback leaks.
- Alternatives considered: Differentiated error messages rejected for information disclosure risk.

## Decision 5: Data Compatibility
- Decision: Reuse existing `clientes` table and add migration only if required for uniqueness or audit support.
- Rationale: Preserves current data and minimizes migration risk.
- Alternatives considered: Replacing auth table from scratch rejected due to compatibility and data continuity concerns.

## Decision 6: Realtime Integration
- Decision: Keep protected websocket channels JWT-gated and compatible with existing v1 contract rules.
- Rationale: Maintains coherent security model across HTTP and realtime transport.
- Alternatives considered: Public realtime access rejected as inconsistent with constitution security principles.

## Decision 7: Documentation and Operability
- Decision: Include register/login endpoints in OpenAPI and ensure Docker runtime works with auth feature enabled.
- Rationale: Required by constitution for discoverability and deployment parity.
- Alternatives considered: Documentation-after-implementation approach rejected due to drift risk.

## Migration Rollback Notes
- Migration file: `src/infrastructure/db/migrations/002_client_auth.sql`
- Rollback strategy:
	- Drop `authentication_audit_events` only if no compliance retention is required.
	- Keep `clientes.activo` and `clientes.created_at` columns when rollback happens after production rollout to avoid data loss.
	- If strict rollback is required in non-production, remove unique constraint `uq_clientes_nombre` and added columns in a controlled maintenance window.
