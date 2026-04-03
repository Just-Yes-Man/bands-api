# Research: Refactor Backend API for Conveyor System

## Decision 1: Architecture Migration Pattern
- Decision: Use strangler migration by domain with temporary coexistence of legacy and refactored interfaces.
- Rationale: Minimizes production risk and allows controlled cutover without halting conveyor operations.
- Alternatives considered: Big-bang replacement was rejected due to high rollback complexity; internal-only refactor was rejected because it does not standardize contracts.

## Decision 2: Backend Layering Strategy
- Decision: Implement explicit layered architecture: transport (REST/WebSocket), application services, domain rules, infrastructure repositories/adapters.
- Rationale: Current code mixes transport, business, and persistence logic; layering reduces coupling and improves testability.
- Alternatives considered: Keep model-centric service object as single orchestration class; rejected due to growing complexity and duplicated rules.

## Decision 3: REST Contract Standardization
- Decision: Version REST APIs with major path prefix `/api/v1` and unify response envelope/error semantics.
- Rationale: Supports backward-compatible evolution during coexistence windows and simplifies client integration.
- Alternatives considered: Header-based versioning was rejected because operational tooling and docs are simpler with path versioning; no explicit versioning was rejected due to migration ambiguity.

## Decision 4: Realtime Contract Strategy
- Decision: Version Socket.IO event names (`*.v1`) and classify events as critical (ack + bounded retry) or informative (best-effort).
- Rationale: Matches user clarification and balances reliability with runtime cost.
- Alternatives considered: At-most-once for all events was rejected for critical state changes; exactly-once semantics for all events was rejected for implementation overhead in this increment.

## Decision 5: Authentication and Authorization
- Decision: JWT auth with RBAC roles `admin`, `supervisor`, and `operator`; protected-by-default for write operations and privileged channels.
- Rationale: Aligns with constitution security requirements and operational role boundaries.
- Alternatives considered: 2-role model was rejected because supervisory actions need separate privilege boundary; 4-role model was deferred as unnecessary for current scope.

## Decision 6: Data Persistence and Migration
- Decision: Keep PostgreSQL as source of truth and manage schema evolution via versioned migrations with rollback notes.
- Rationale: Existing data model already runs on PostgreSQL and must remain auditable.
- Alternatives considered: Rebuild schema from scratch was rejected due to migration risk and data loss potential.

## Decision 7: Idempotency Policy
- Decision: Do not require mandatory idempotency key in API contract for this feature increment.
- Rationale: Explicitly chosen in clarification; duplicate write handling remains client retry + server business validation responsibility.
- Alternatives considered: Mandatory idempotency key for critical writes was rejected for now to avoid broad contract and storage changes.

## Decision 8: Testing Approach
- Decision: Add unit tests for domain/application services, integration tests for REST and websocket flows, and contract validation checks.
- Rationale: Ensures migration safety while preserving behavior equivalence.
- Alternatives considered: Integration-only testing was rejected because service-layer regressions would be harder to isolate.

## Decision 9: Documentation and Operability
- Decision: Maintain OpenAPI/Swagger as source of truth for REST and maintain explicit websocket contract documentation; validate Docker startup and health checks.
- Rationale: Improves onboarding and deployment confidence while satisfying constitution gates.
- Alternatives considered: Post-implementation documentation updates were rejected due to drift risk during phased migration.
