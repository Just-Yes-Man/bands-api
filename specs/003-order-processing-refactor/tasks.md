# Tasks: Procesamiento Orientado a Pedidos

**Input**: Design documents from /specs/003-order-processing-refactor/
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: This plan includes explicit unit, contract, and integration tests to satisfy constitution quality gates.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: [ID] [P?] [Story] Description

- [P]: Can run in parallel (different files, no dependencies)
- [Story]: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization for order-oriented domain

- [X] T001 Add order feature environment keys in .env.example
- [X] T002 Add order-focused script aliases in package.json
- [X] T003 [P] Register orders OpenAPI source in src/infrastructure/config/swagger.js
- [X] T004 [P] Add order quickstart execution checklist in specs/003-order-processing-refactor/quickstart.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before user story work

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Create SQL migration for pedidos, lineas_pedido, pedido_state_events in src/infrastructure/db/migrations/003_orders_domain.sql
- [ ] T006 [P] Add migration rollback notes for orders schema in specs/003-order-processing-refactor/research.md
- [X] T007 [P] Create order DTO validation schemas in src/shared/contracts/order-schemas.js
- [X] T008 [P] Create order domain error catalog in src/shared/errors/order-errors.js
- [X] T009 [P] Implement order state transition policy in src/domain/policies/order-state-policy.js
- [X] T010 [P] Implement optimistic concurrency helper for version checks in src/domain/policies/order-concurrency-policy.js
- [X] T011 [P] Implement pedidos repository (header CRUD + transitions) in src/infrastructure/db/repositories/orders.repository.js
- [X] T012 [P] Implement lineas_pedido repository (line updates + cancel) in src/infrastructure/db/repositories/order-lines.repository.js
- [X] T013 [P] Implement pedido_state_events repository in src/infrastructure/db/repositories/order-state-events.repository.js
- [X] T014 Implement order realtime delivery service (critical ack/retry + best-effort) in src/application/services/order-realtime.service.js
- [X] T015 Implement order application orchestrator service wiring repositories and policies in src/application/services/orders.service.js
- [X] T016 Add orders dependency wiring in src/infrastructure/config/container.js
- [X] T016A [P] Implement orders HTTP auth middleware (JWT + role/ownership checks) in src/api/http/v1/middlewares/orders-auth.js
- [X] T016B [P] Implement orders realtime auth middleware (JWT + role checks) in src/api/socket/v1/middlewares/orders-socket-auth.js
- [X] T016C [P] Add unit tests for orders auth policy and ownership checks in tests/unit/orders/orders-auth-policy.test.js
- [X] T017 Mount secured orders routes (with auth middleware) in src/api/http/v1/routes/index.js
- [X] T018 Register secured orders websocket gateway (with auth middleware) in src/api/server.js

**Checkpoint**: Foundation ready; user stories can now proceed

---

## Phase 3: User Story 1 - Crear Pedido con Multiples Lineas (Priority: P1) MVP

**Goal**: Crear pedidos con multiples lineas validas y estado inicial consistente

**Independent Test**: Crear pedido con dos lineas y confirmar persistencia cabecera/lineas en estado inicial PENDIENTE

### Tests for User Story 1

- [ ] T019 [P] [US1] Add unit tests for order creation rules in tests/unit/orders/create-order.service.test.js
- [ ] T020 [P] [US1] Add contract tests for POST /api/v1/orders in tests/contract/http/orders-create.contract.test.js
- [ ] T021 [US1] Add integration tests for create order success/duplicates/invalid input in tests/integration/http/orders-create.integration.test.js

### Implementation for User Story 1

- [X] T022 [P] [US1] Create create-order DTO mapper in src/application/dto/create-order.dto.js
- [X] T023 [US1] Implement create order use case in src/application/use-cases/create-order.use-case.js
- [X] T024 [P] [US1] Implement create order controller in src/api/http/v1/controllers/orders-create.controller.js
- [X] T025 [P] [US1] Add POST /api/v1/orders endpoint in src/api/http/v1/routes/orders.routes.js
- [X] T026 [US1] Wire create order endpoint into v1 router in src/api/http/v1/routes/index.js
- [X] T027 [US1] Record CREATED order state events in src/application/services/orders.service.js
- [ ] T028 [US1] Align create order request/response examples in specs/003-order-processing-refactor/contracts/order-api.yaml

**Checkpoint**: User Story 1 is independently functional and testable

---

## Phase 4: User Story 2 - Consultar Pedidos y Detalle de Progreso (Priority: P2)

**Goal**: Consultar pedidos por cliente y detalle con progreso agregado

**Independent Test**: Consultar listado por cliente y detalle de pedido con resumen total coherente

### Tests for User Story 2

- [ ] T029 [P] [US2] Add unit tests for progress aggregation rules in tests/unit/orders/order-progress.service.test.js
- [ ] T030 [P] [US2] Add contract tests for GET /api/v1/orders and GET /api/v1/orders/{id} in tests/contract/http/orders-query.contract.test.js
- [ ] T031 [US2] Add integration tests for list/detail query and pagination in tests/integration/http/orders-query.integration.test.js
- [ ] T031A [US2] Add integration tests for forbidden cross-client order access in tests/integration/http/orders-authorization.integration.test.js

### Implementation for User Story 2

- [X] T032 [P] [US2] Create list/detail query DTO mappers in src/application/dto/query-orders.dto.js
- [X] T033 [US2] Implement list orders use case in src/application/use-cases/list-orders.use-case.js
- [X] T034 [US2] Implement get order detail use case in src/application/use-cases/get-order-detail.use-case.js
- [X] T035 [P] [US2] Implement list orders controller in src/api/http/v1/controllers/orders-list.controller.js
- [X] T036 [P] [US2] Implement order detail controller in src/api/http/v1/controllers/orders-detail.controller.js
- [X] T037 [US2] Add GET /api/v1/orders and GET /api/v1/orders/:orderId endpoints in src/api/http/v1/routes/orders.routes.js
- [X] T038 [US2] Implement aggregated ProgresoPedido projection in src/application/services/orders.service.js
- [ ] T039 [US2] Align list/detail response contracts in specs/003-order-processing-refactor/contracts/order-api.yaml

**Checkpoint**: User Stories 1 and 2 are independently functional and testable

---

## Phase 5: User Story 3 - Actualizacion Automatizada de Estado del Pedido (Priority: P3)

**Goal**: Actualizar progreso incremental, aplicar cancelacion parcial y transiciones automaticas con realtime confiable

**Independent Test**: Reportar progreso incremental y cancelaciones parciales; validar transiciones EN_PROCESO/COMPLETADO/CANCELADO y eventos realtime

### Tests for User Story 3

- [ ] T040 [P] [US3] Add unit tests for state transition priority and cancellation rules in tests/unit/orders/order-state-policy.test.js
- [ ] T041 [P] [US3] Add contract tests for progress and line-cancel endpoints in tests/contract/http/orders-progress.contract.test.js
- [ ] T042 [P] [US3] Add contract tests for websocket orders events in tests/contract/socket/orders-events.contract.test.js
- [ ] T043 [US3] Add integration tests for incremental progress concurrency conflicts in tests/integration/http/orders-progress.integration.test.js
- [ ] T044 [US3] Add integration tests for critical ack/retry delivery in tests/integration/socket/orders-critical-delivery.integration.test.js

### Implementation for User Story 3

- [X] T045 [P] [US3] Create progress update DTO mapper in src/application/dto/order-progress-update.dto.js
- [X] T046 [US3] Implement update line progress use case with optimistic locking in src/application/use-cases/update-order-line-progress.use-case.js
- [X] T047 [US3] Implement cancel line use case in src/application/use-cases/cancel-order-line.use-case.js
- [X] T048 [P] [US3] Implement progress update controller in src/api/http/v1/controllers/orders-progress.controller.js
- [X] T049 [P] [US3] Implement line cancel controller in src/api/http/v1/controllers/orders-line-cancel.controller.js
- [X] T050 [US3] Add progress and line-cancel endpoints in src/api/http/v1/routes/orders.routes.js
- [X] T051 [US3] Implement order status recomputation and terminal-state enforcement in src/application/services/orders.service.js
- [X] T052 [US3] Emit critical events order.progress.updated.v1 and order.status.changed.v1 in src/application/services/order-realtime.service.js
- [X] T053 [US3] Emit informational event order.summary.updated.v1 in src/application/services/order-realtime.service.js
- [X] T054 [US3] Implement orders realtime gateway handlers in src/api/socket/v1/gateways/orders.gateway.js
- [X] T055 [US3] Register orders gateway in socket bootstrap in src/api/socket/v1/index.js
- [ ] T056 [US3] Align websocket event contracts and ack policy notes in specs/003-order-processing-refactor/contracts/websocket-orders.md

**Checkpoint**: All user stories are independently functional and testable

---

## Phase 6: Polish and Cross-Cutting Concerns

**Purpose**: Final hardening, evidence, and operational validation

- [X] T057 [P] Update Swagger docs route integration for orders endpoints in src/api/http/v1/routes/docs.routes.js
- [X] T058 [P] Add order security log redaction rules in src/infrastructure/logging/security-log-policy.js
- [ ] T059 Capture p95 order create/query latency evidence in specs/003-order-processing-refactor/perf/orders-latency-report.md
- [ ] T060 Capture realtime ack/retry and cancellation consistency evidence in specs/003-order-processing-refactor/perf/orders-realtime-report.md
- [X] T061 Validate docker build/startup and migrations for orders flow in specs/003-order-processing-refactor/quickstart.md
- [X] T062 Run full order-focused test suites and record outcomes in specs/003-order-processing-refactor/quickstart.md
- [ ] T062A Run explicit authorization regression suite for orders access rules in tests/integration/http/orders-authorization.integration.test.js

---

## Dependencies and Execution Order

### Phase Dependencies

- Setup (Phase 1): no dependencies
- Foundational (Phase 2): depends on Setup; blocks all user stories
- User Story phases (Phase 3-5): depend on Foundational completion
- Polish (Phase 6): depends on targeted user stories completion

### User Story Dependencies

- US1 (P1): starts after Phase 2, independent MVP slice
- US2 (P2): starts after Phase 2; reuses order creation artifacts but remains independently testable
- US3 (P3): starts after Phase 2; depends on order entities plus query/progress infrastructure
- Authorization gate: T016C and T031A should complete before promoting orders query endpoints

### Within Each User Story

- Tests first, expected to fail before implementation
- DTO/contracts before controllers/use-cases
- Use-cases and services before endpoint exposure
- Endpoint implementation before quickstart/perf evidence

## Parallel Opportunities

- Setup: T003 and T004 in parallel
- Foundational: T007-T013 in parallel, then merge in T014-T016 and security tasks T016A-T016C
- US1: T019 and T020 in parallel
- US2: T029 and T030 in parallel
- US3: T040-T042 in parallel, and T048/T049 in parallel after core use-cases exist
- Polish: T057 and T058 in parallel

## Parallel Example: User Story 1

Task: T019 [US1] Add unit tests for order creation rules in tests/unit/orders/create-order.service.test.js
Task: T020 [US1] Add contract tests for POST /api/v1/orders in tests/contract/http/orders-create.contract.test.js
Task: T022 [US1] Create create-order DTO mapper in src/application/dto/create-order.dto.js

## Parallel Example: User Story 3

Task: T040 [US3] Add unit tests for state transition priority and cancellation rules in tests/unit/orders/order-state-policy.test.js
Task: T041 [US3] Add contract tests for progress and line-cancel endpoints in tests/contract/http/orders-progress.contract.test.js
Task: T042 [US3] Add contract tests for websocket orders events in tests/contract/socket/orders-events.contract.test.js

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1 and Phase 2
2. Deliver Phase 3 (US1)
3. Validate create-order flow end-to-end
4. Demo/deploy MVP

### Incremental Delivery

1. Foundation complete
2. Add US1 (create)
3. Add US2 (query/progress read)
4. Add US3 (state automation + realtime)
5. Complete polish and evidence tasks

### Suggested MVP Scope

- Phases 1-3 (Setup + Foundational + US1)
- Provides immediate business value: order creation with multi-line persistence and domain baseline
