# Tasks: Flujo de Procesamiento y Medicion de Pedidos

**Input**: Design documents from /specs/004-order-measurement-flow/
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: This plan includes explicit unit, contract, and integration tests to satisfy constitution quality gates.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: [ID] [P?] [Story] Description

- [P]: Can run in parallel (different files, no dependencies)
- [Story]: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization for measurement-process domain

- [X] T001 Add measurement-flow environment keys in .env.example
- [X] T002 Add measurement-focused script aliases in package.json
- [X] T003 [P] Register measurement OpenAPI source in src/infrastructure/config/swagger.js
- [X] T004 [P] Add measurement smoke checklist in specs/004-order-measurement-flow/quickstart.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before user story work

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Create SQL migration for procesos_medicion, historial_estados_proceso, mediciones (including actor/context audit columns) and monitor-consistency guards in src/infrastructure/db/migrations/004_measurement_flow.sql
- [X] T006 [P] Add migration rollback notes for measurement schema in specs/004-order-measurement-flow/research.md
- [X] T007 [P] Create measurement DTO validation schemas (including idempotencyKey format/length rules) in src/shared/contracts/measurement-schemas.js
- [X] T008 [P] Create measurement domain error catalog in src/shared/errors/measurement-errors.js
- [X] T009 [P] Implement process state transition policy in src/domain/policies/measurement-process-state-policy.js
- [X] T010 [P] Implement strict measurement-result policy in src/domain/policies/measurement-result-policy.js
- [X] T011 [P] Implement idempotency policy helper for measurement keys in src/domain/policies/measurement-idempotency-policy.js
- [X] T012 [P] Implement measurement-process repository in src/infrastructure/db/repositories/measurement-processes.repository.js
- [X] T013 [P] Implement process-state-history repository with actor/context persistence in src/infrastructure/db/repositories/measurement-process-state-history.repository.js
- [X] T014 [P] Implement measurements repository with idempotency lookup and actor/context persistence in src/infrastructure/db/repositories/measurements.repository.js
- [X] T015 Implement measurement-process orchestration service in src/application/services/measurement-processes.service.js
- [X] T016 Implement measurement-capture service integrating order progress updates in src/application/services/measurement-capture.service.js
- [X] T017 Add measurement dependency wiring in src/infrastructure/config/container.js
- [X] T018 [P] Implement measurement HTTP auth middleware in src/api/http/v1/middlewares/measurement-auth.js
- [X] T019 [P] Implement measurement realtime auth middleware in src/api/socket/v1/middlewares/measurement-socket-auth.js
- [X] T020 [P] Add foundational unit tests for process state/result/idempotency policies in tests/unit/measurement/measurement-policies.test.js
- [X] T021 Mount measurement routes in src/api/http/v1/routes/index.js
- [X] T022 Register measurement gateway in src/api/socket/v1/index.js
- [X] T023 Enforce manual progress lock when active measurement process exists in src/application/services/orders.service.js

**Checkpoint**: Foundation ready; user stories can now proceed

---

## Phase 3: User Story 1 - Iniciar y Trazar Procesos de Medicion (Priority: P1) MVP

**Goal**: Iniciar procesos de medicion, aplicar transiciones validas y mantener historial auditable

**Independent Test**: Crear proceso para una linea activa, moverlo a EN_PROCESO y validar historial completo de estados

### Tests for User Story 1

- [X] T024 [P] [US1] Add contract tests for create-process and state-transition endpoints (including process without lineaPedidoId) in tests/contract/http/measurement-process-lifecycle.contract.test.js
- [X] T025 [P] [US1] Add integration tests for process lifecycle and state-history persistence (including actor/context audit fields and process without lineaPedidoId) in tests/integration/http/measurement-process-lifecycle.integration.test.js

### Implementation for User Story 1

- [X] T026 [P] [US1] Create create-process and transition-state DTO mappers with optional lineaPedidoId in src/application/dto/measurement-process.dto.js
- [X] T027 [US1] Implement create measurement-process use case supporting pedido-level processes (sin linea) in src/application/use-cases/create-measurement-process.use-case.js
- [X] T028 [US1] Implement transition measurement-process-state use case in src/application/use-cases/transition-measurement-process-state.use-case.js
- [X] T029 [P] [US1] Implement create/transition controllers in src/api/http/v1/controllers/measurement-process-create.controller.js
- [X] T030 [P] [US1] Implement create/transition controllers in src/api/http/v1/controllers/measurement-process-state.controller.js
- [X] T031 [US1] Add create-process and transition-state routes in src/api/http/v1/routes/measurement-process.routes.js
- [X] T032 [US1] Persist initial and transition history events with actor/context metadata in src/application/services/measurement-processes.service.js
- [X] T033 [US1] Align create/transition examples in specs/004-order-measurement-flow/contracts/measurement-api.yaml (including process without lineaPedidoId)

**Checkpoint**: User Story 1 is independently functional and testable

---

## Phase 4: User Story 2 - Registrar Mediciones y Actualizar Progreso (Priority: P1)

**Goal**: Registrar mediciones con idempotencia estricta y aplicar progreso automatico a linea/pedido

**Independent Test**: Registrar medicion aprobada y rechazada sobre proceso EN_PROCESO, verificar deltas correctos y rechazo de duplicados

### Tests for User Story 2

- [X] T034 [P] [US2] Add contract tests for register-measurement endpoint conflicts/idempotency in tests/contract/http/measurement-register.contract.test.js
- [X] T035 [P] [US2] Add integration tests for measurement-to-progress application and measurement audit metadata persistence in tests/integration/http/measurement-progress-application.integration.test.js
- [X] T036 [US2] Add integration tests for duplicate idempotency-key no-overcount behavior in tests/integration/http/measurement-idempotency.integration.test.js
- [X] T037 [US2] Add integration tests for manual-progress lock when process is active in tests/integration/http/measurement-manual-lock.integration.test.js

### Implementation for User Story 2

- [X] T038 [P] [US2] Create register-measurement DTO mapper in src/application/dto/register-measurement.dto.js
- [X] T039 [US2] Implement register measurement use case in src/application/use-cases/register-measurement.use-case.js
- [X] T040 [US2] Implement register measurement controller in src/api/http/v1/controllers/measurement-register.controller.js
- [X] T041 [US2] Add register-measurement route in src/api/http/v1/routes/measurement-process.routes.js
- [X] T042 [US2] Implement strict resultado_final classification in src/application/services/measurement-capture.service.js
- [X] T043 [US2] Implement idempotency-key persistence/check in src/infrastructure/db/repositories/measurements.repository.js
- [X] T044 [US2] Apply order/line progress deltas from measurement results in src/application/services/measurement-capture.service.js
- [X] T045 [US2] Emit realtime events measurement.process.started.v1, measurement.process.state.changed.v1, measurement.recorded.v1 and measurement.progress.applied.v1 in src/application/services/measurement-realtime.service.js
- [X] T046 [US2] Integrate measurement realtime service with process/capture services in src/application/services/measurement-processes.service.js
- [X] T047 [US2] Align register-measurement response examples in specs/004-order-measurement-flow/contracts/measurement-api.yaml
- [X] T048 [US2] Align realtime event payloads and ack policy (started/state/recorded/progress) in specs/004-order-measurement-flow/contracts/websocket-measurement.md

**Checkpoint**: User Stories 1 and 2 are independently functional and testable

---

## Phase 5: User Story 3 - Consultar Estado Operativo de Procesos (Priority: P2)

**Goal**: Consultar procesos por pedido y detalle completo con historial y mediciones asociadas

**Independent Test**: Listar procesos de un pedido y abrir detalle de un proceso verificando consistencia entre estado actual, historial y mediciones

### Tests for User Story 3

- [X] T049 [P] [US3] Add contract tests for process list/detail endpoints in tests/contract/http/measurement-query.contract.test.js
- [X] T050 [P] [US3] Add integration tests for process list/detail aggregation in tests/integration/http/measurement-query.integration.test.js

### Implementation for User Story 3

- [X] T051 [P] [US3] Create query DTO mappers for measurement process listing/detail in src/application/dto/query-measurement-processes.dto.js
- [X] T052 [US3] Implement list measurement-processes use case in src/application/use-cases/list-measurement-processes.use-case.js
- [X] T053 [US3] Implement get measurement-process detail use case in src/application/use-cases/get-measurement-process-detail.use-case.js
- [X] T054 [P] [US3] Implement process-list controller in src/api/http/v1/controllers/measurement-process-list.controller.js
- [X] T055 [P] [US3] Implement process-detail controller in src/api/http/v1/controllers/measurement-process-detail.controller.js
- [X] T056 [US3] Add process list/detail routes in src/api/http/v1/routes/measurement-process.routes.js
- [X] T057 [US3] Implement process-detail aggregation (process + history + measurements) in src/application/services/measurement-processes.service.js
- [X] T058 [US3] Implement measurement subscription gateway handlers in src/api/socket/v1/gateways/measurement.gateway.js

**Checkpoint**: All user stories are independently functional and testable

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, evidence, and operational validation

- [X] T059 [P] Update Swagger docs integration for measurement endpoints in src/api/http/v1/routes/docs.routes.js
- [X] T060 [P] Add measurement payload redaction rules in src/infrastructure/logging/security-log-policy.js
- [X] T061 Capture p95 process-start and measurement-apply latency evidence in specs/004-order-measurement-flow/perf/measurement-latency-report.md
- [X] T062 Capture idempotency and transition-consistency evidence in specs/004-order-measurement-flow/perf/measurement-consistency-report.md
- [X] T063 Validate docker build/startup and migration 004 flow in specs/004-order-measurement-flow/quickstart.md
- [X] T064 Run full measurement-focused test suites and record outcomes in specs/004-order-measurement-flow/quickstart.md
- [X] T065 [P] Add JWT + per-operation role-matrix + client-ownership authorization regression tests for measurement endpoints in tests/integration/http/measurement-auth.integration.test.js
- [X] T066 [P] Add migration compatibility regression tests for monitores_proceso consistency in tests/integration/migration/measurement-monitor-compat.integration.test.js

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): no dependencies
- Foundational (Phase 2): depends on Setup; blocks all user stories
- User Story phases (Phase 3-5): depend on Foundational completion
- Polish (Phase 6): depends on targeted user stories completion

### User Story Dependencies

- US1 (P1): starts after Phase 2, independent MVP slice
- US2 (P1): starts after Phase 2; depends on process lifecycle artifacts but remains independently testable
- US3 (P2): starts after Phase 2; depends on process and measurement persistence being available
- Safety gate: T023 and T037 should complete before promoting measurement flow as source of truth for progress

### Within Each User Story

- Tests first, expected to fail before implementation
- DTO/contracts before controllers/use-cases
- Use-cases and services before endpoint exposure
- Endpoint implementation before quickstart/perf evidence

## Parallel Opportunities

- Setup: T003 and T004 in parallel
- Foundational: T007-T014 and T018-T020 in parallel, then merge in T015-T017 and T021-T023
- US1: T024 and T025 in parallel; T029 and T030 in parallel
- US2: T034 and T035 in parallel; T038 with test authoring can proceed in parallel
- US3: T049 and T050 in parallel; T054 and T055 in parallel
- Polish: T059 and T060 in parallel; T061 and T062 in parallel

## Parallel Example: User Story 1

Task: T024 [US1] Add contract tests for create-process and state-transition endpoints in tests/contract/http/measurement-process-lifecycle.contract.test.js
Task: T025 [US1] Add integration tests for process lifecycle and state-history persistence (including actor/context audit fields) in tests/integration/http/measurement-process-lifecycle.integration.test.js
Task: T026 [US1] Create create-process and transition-state DTO mappers in src/application/dto/measurement-process.dto.js

## Parallel Example: User Story 2

Task: T034 [US2] Add contract tests for register-measurement endpoint conflicts/idempotency in tests/contract/http/measurement-register.contract.test.js
Task: T035 [US2] Add integration tests for measurement-to-progress application and measurement audit metadata persistence in tests/integration/http/measurement-progress-application.integration.test.js
Task: T038 [US2] Create register-measurement DTO mapper in src/application/dto/register-measurement.dto.js

## Implementation Strategy

### MVP First (US1 + core US2)

1. Complete Phase 1 and Phase 2
2. Deliver Phase 3 (US1)
3. Deliver core Phase 4 path (T038-T045)
4. Validate process start, measurement registration, and progress update end-to-end

### Incremental Delivery

1. Foundation complete
2. Add US1 (process lifecycle)
3. Add US2 (measurement capture + progress application)
4. Add US3 (query and audit visibility)
5. Complete polish and evidence tasks

### Suggested MVP Scope

- Phases 1-4 (Setup + Foundational + US1 + core US2)
- Provides immediate value: process tracking and automatic progress application from measurements
