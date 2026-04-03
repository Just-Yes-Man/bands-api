# Tasks: Refactor Backend API for Conveyor System

**Input**: Design documents from `/specs/001-refactor-backend-api/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`)
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize project scaffolding for layered backend and migration-safe runtime.

- [X] T001 Create layered backend directories in src/api, src/application, src/domain, src/infrastructure, and src/shared
- [X] T002 Update scripts and runtime commands in package.json
- [X] T003 [P] Add environment template for JWT, PostgreSQL, and runtime flags in .env.example
- [X] T004 [P] Create Docker runtime definition for backend service in Dockerfile
- [X] T005 [P] Create local stack orchestration for app and PostgreSQL in docker-compose.yml
- [X] T006 [P] Add base test config for unit and integration suites in jest.config.js

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement mandatory foundations that block all user-story work.

**⚠️ CRITICAL**: No user story implementation starts before this phase is complete.

- [X] T007 Implement centralized environment and config loader in src/infrastructure/config/env.js
- [X] T008 [P] Implement PostgreSQL client bootstrap and lifecycle handling in src/infrastructure/db/postgres.js
- [X] T009 [P] Add initial migration files for auth, checkpoint lifecycle, and audit fields in src/infrastructure/db/migrations/001_init_refactor.sql
- [X] T010 Implement migration runner and startup integration in src/infrastructure/db/migrate.js
- [X] T011 [P] Implement shared error taxonomy and HTTP mapping in src/shared/errors/app-error.js
- [X] T012 [P] Implement structured logger and request correlation support in src/infrastructure/logging/logger.js
- [X] T013 Implement JWT verification middleware and token parsing in src/api/http/v1/middlewares/auth-jwt.js
- [X] T014 Implement RBAC guard for admin/supervisor/operator in src/api/http/v1/middlewares/rbac.js
- [X] T015 [P] Implement Socket.IO auth and role gate middleware in src/api/socket/v1/gateways/socket-auth.js
- [X] T015A [P] Implement websocket payload runtime validation middleware for v1 command events in src/api/socket/v1/middlewares/payload-validator.js
- [X] T016 [P] Add OpenAPI bootstrap and swagger serving route in src/api/http/v1/routes/docs.routes.js
- [X] T017 Implement health endpoint and readiness checks in src/api/http/v1/controllers/health.controller.js
- [X] T018 Implement v1 server bootstrap wiring REST and Socket.IO gateways in src/api/server.js
- [X] T019 Add legacy-to-v1 strangler entry routing in app.js

**Checkpoint**: Foundation complete, user story development can proceed.

---

## Phase 3: User Story 1 - Operar Flujo de Productos por API Estandarizada (Priority: P1) 🎯 MVP

**Goal**: Deliver stable `/api/v1` endpoints for product models and checkpoint registration with layered business logic.

**Independent Test**: Create/list product models and register checkpoint events through REST with consistent responses and PostgreSQL persistence.

### Tests for User Story 1

- [X] T020 [P] [US1] Add contract tests for /api/v1/product-models in tests/contract/http/product-models.contract.test.js
- [X] T021 [P] [US1] Add contract tests for /api/v1/checkpoints in tests/contract/http/checkpoints.contract.test.js
- [X] T022 [P] [US1] Add integration tests for product flow REST journey in tests/integration/http/product-flow.integration.test.js
- [X] T023 [P] [US1] Add unit tests for checkpoint decision service in tests/unit/application/checkpoint-evaluator.service.test.js

### Implementation for User Story 1

- [X] T024 [P] [US1] Implement ProductModel domain entity and validation rules in src/domain/entities/product-model.entity.js
- [X] T025 [P] [US1] Implement ProductCheckpointEvent domain entity and lifecycle guards in src/domain/entities/product-checkpoint-event.entity.js
- [X] T026 [P] [US1] Implement ProductModel repository adapter for PostgreSQL in src/infrastructure/db/repositories/product-model.repository.js
- [X] T027 [P] [US1] Implement Checkpoint repository adapter for PostgreSQL in src/infrastructure/db/repositories/checkpoint.repository.js
- [X] T028 [US1] Implement product model use cases in src/application/use-cases/product-model.use-case.js
- [X] T029 [US1] Implement checkpoint registration and evaluation service in src/application/services/checkpoint.service.js
- [X] T030 [US1] Implement product model REST controller in src/api/http/v1/controllers/product-model.controller.js
- [X] T031 [US1] Implement checkpoint REST controller in src/api/http/v1/controllers/checkpoint.controller.js
- [X] T032 [US1] Register v1 routes for product models and checkpoints in src/api/http/v1/routes/index.js
- [X] T033 [US1] Add DTO validators and response mappers for US1 endpoints in src/application/dto/us1.dto.js

**Checkpoint**: US1 is independently functional and can be demonstrated as MVP.

---

## Phase 4: User Story 2 - Monitoreo en Tiempo Real Confiable (Priority: P2)

**Goal**: Provide versioned realtime contracts with initial snapshot, critical ack+retry, and informative best-effort updates.

**Independent Test**: Connect authenticated websocket clients, trigger checkpoint changes, and verify versioned event delivery semantics.

### Tests for User Story 2

- [X] T034 [P] [US2] Add websocket contract tests for v1 event names and payloads in tests/contract/socket/websocket-events.contract.test.js
- [X] T034A [P] [US2] Add websocket payload validation failure tests for invalid command payloads in tests/contract/socket/websocket-payload-validation.contract.test.js
- [X] T035 [P] [US2] Add integration tests for critical event ack and retry behavior in tests/integration/socket/critical-delivery.integration.test.js
- [X] T036 [P] [US2] Add integration tests for initial snapshot and metrics updates in tests/integration/socket/snapshot-and-metrics.integration.test.js

### Implementation for User Story 2

- [X] T037 [P] [US2] Implement realtime delivery record repository in src/infrastructure/db/repositories/realtime-delivery.repository.js
- [X] T038 [US2] Implement delivery policy service for critical and informative events in src/application/services/realtime-delivery.service.js
- [X] T039 [US2] Implement v1 socket event handlers for client-to-server operations in src/api/socket/v1/handlers/command.handlers.js
- [X] T039A [US2] Integrate runtime payload validator into websocket command handling pipeline in src/api/socket/v1/handlers/command.handlers.js
- [X] T040 [US2] Implement v1 server-to-client event publisher and naming policy in src/api/socket/v1/events/publisher.js
- [X] T041 [US2] Implement initial snapshot gateway and authorization checks in src/api/socket/v1/gateways/snapshot.gateway.js
- [X] T042 [US2] Integrate checkpoint domain updates with websocket publishing in src/application/services/checkpoint-realtime-orchestrator.service.js

**Checkpoint**: US2 works independently with authenticated realtime visibility and contract-compliant events.

---

## Phase 5: User Story 3 - Backend Mantenible y Seguro por Capas (Priority: P3)

**Goal**: Complete layered separation, enforce RBAC paths, and support strangler migration with controlled compatibility.

**Independent Test**: Verify role-based restrictions, traceability, and coexistence of legacy and v1 interfaces during migration window.

### Tests for User Story 3

- [X] T043 [P] [US3] Add integration tests for RBAC enforcement across admin/supervisor/operator in tests/integration/http/rbac.integration.test.js
- [X] T044 [P] [US3] Add integration tests for legacy-to-v1 coexistence path in tests/integration/migration/strangler-compat.integration.test.js
- [X] T044A [P] [US3] Add migration gate tests for deprecation thresholds (<5% legacy traffic for 7 days) in tests/integration/migration/deprecation-gates.integration.test.js
- [X] T045 [P] [US3] Add unit tests for authorization policy and audit requirements in tests/unit/domain/access-policy.test.js
- [X] T045A [P] [US3] Add REST contract guard tests ensuring no mandatory idempotency key in v1 writes in tests/contract/http/non-idempotency.contract.test.js

### Implementation for User Story 3

- [X] T046 [P] [US3] Implement OperatorIdentity repository and lookup service in src/infrastructure/db/repositories/operator-identity.repository.js
- [X] T047 [US3] Implement access policy module for route/event actions in src/domain/policies/access-policy.js
- [X] T048 [US3] Implement audit trail service for protected state changes in src/application/services/audit-trail.service.js
- [X] T049 [US3] Implement monitor administration use cases with role boundaries in src/application/use-cases/process-monitor.use-case.js
- [X] T050 [US3] Implement v1 monitor administration endpoints in src/api/http/v1/controllers/process-monitor.controller.js
- [X] T051 [US3] Implement compatibility/deprecation registry for legacy endpoints/events in src/shared/contracts/deprecation-registry.js
- [X] T052 [US3] Wire deprecation enforcement and migration toggles in src/infrastructure/config/feature-flags.js
- [X] T052A [US3] Implement deprecation policy evaluator for 30-day window and removal gates in src/application/services/deprecation-policy.service.js

**Checkpoint**: US3 ensures maintainability, security, and controlled migration behavior.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finish operational readiness and documentation alignment across all stories.

- [X] T053 [P] Align Swagger/OpenAPI definitions with implemented v1 endpoints in specs/001-refactor-backend-api/contracts/rest-api.yaml
- [X] T054 [P] Align websocket documentation with implemented v1 events in specs/001-refactor-backend-api/contracts/websocket-events.md
- [X] T055 Add quickstart execution notes and troubleshooting updates in specs/001-refactor-backend-api/quickstart.md
- [X] T056 Validate Docker build/startup and health checks in Dockerfile
- [ ] T057 Remove unused legacy-only code paths after compatibility criteria are met in server/server.js
- [X] T058 Run full automated test suites and capture baseline results in tests/README.md
- [X] T059 [P] Execute REST latency load verification (p95) and capture evidence in specs/001-refactor-backend-api/perf/rest-latency-report.md
- [ ] T060 [P] Execute critical realtime ack-rate verification and capture evidence in specs/001-refactor-backend-api/perf/realtime-ack-report.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): no dependencies, starts immediately.
- Foundational (Phase 2): depends on Setup completion; blocks all stories.
- User Story phases (Phase 3-5): depend on Foundational completion.
- Polish (Phase 6): depends on completion of targeted user stories.

### User Story Dependencies

- US1 (P1): starts immediately after Foundational; defines MVP.
- US2 (P2): depends on US1 checkpoint flow outputs for realtime publication hooks.
- US3 (P3): depends on US1 and US2 contracts to enforce role boundaries and migration controls.

### Within Each User Story

- Tests for story first, then domain/repository, then services/use-cases, then controllers/routes/gateways, then integration wiring.

### Parallel Opportunities

- Setup tasks marked [P] can run simultaneously.
- Foundational [P] tasks can run in parallel after T007 baseline config.
- In US1, entity/repository tasks T024-T027 can run in parallel.
- In US2, contract/integration tests T034-T036 and repository task T037 can run in parallel.
- In US3, tests T043-T045 and repository/policy seed tasks T046-T047 can run in parallel.
- Polish docs tasks T053 and T054 can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Parallel contract and integration test preparation
Task: "T020 [US1] Add contract tests for /api/v1/product-models in tests/contract/http/product-models.contract.test.js"
Task: "T021 [US1] Add contract tests for /api/v1/checkpoints in tests/contract/http/checkpoints.contract.test.js"
Task: "T022 [US1] Add integration tests for product flow REST journey in tests/integration/http/product-flow.integration.test.js"

# Parallel domain and repository implementation
Task: "T024 [US1] Implement ProductModel domain entity in src/domain/entities/product-model.entity.js"
Task: "T025 [US1] Implement ProductCheckpointEvent domain entity in src/domain/entities/product-checkpoint-event.entity.js"
Task: "T026 [US1] Implement ProductModel repository adapter in src/infrastructure/db/repositories/product-model.repository.js"
Task: "T027 [US1] Implement Checkpoint repository adapter in src/infrastructure/db/repositories/checkpoint.repository.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Deliver US1 tests + implementation (T020-T033).
3. Validate independent MVP operation via `/api/v1/product-models` and `/api/v1/checkpoints`.
4. Demo and stabilize before enabling realtime migration.

### Incremental Delivery

1. US1: REST functional baseline and persistence consistency.
2. US2: Realtime contract rollout with versioned event channels.
3. US3: Security hardening, migration control, and maintainability completion.
4. Polish: docs/docker/test baselines finalized.

### Parallel Team Strategy

1. Team A: Foundational auth/config/migrations.
2. Team B: US1 domain + repositories + REST controllers.
3. Team C: US2 realtime delivery and event contracts once US1 checkpoint service is available.
4. Team D: US3 RBAC/audit/compatibility hardening after US1-US2 contracts stabilize.
