# Tasks: Registro y Login de Clientes

**Input**: Design documents from `/specs/002-cliente-auth/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: This task plan includes explicit unit, contract, and integration test tasks to satisfy constitution quality gates for auth and protected realtime flows.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and auth feature scaffolding

- [X] T001 Add auth feature environment variables in `.env.example`
- [X] T002 Add auth-related npm scripts in `package.json`
- [X] T003 [P] Create client auth OpenAPI registration in `src/infrastructure/config/swagger.js`
- [X] T004 [P] Add auth quickstart performance checklist section in `specs/002-cliente-auth/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core auth and security infrastructure that MUST be complete before user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Create client auth Zod schemas in `src/shared/contracts/client-auth-schemas.js`
- [X] T006 [P] Add generic auth error types/codes in `src/shared/errors/auth-errors.js`
- [X] T007 [P] Implement client password policy validator in `src/domain/policies/client-password-policy.js`
- [X] T008 [P] Implement JWT client token service (1h expiration) in `src/infrastructure/auth/client-jwt-service.js`
- [X] T009 [P] Implement login rate-limit store by IP/user in `src/infrastructure/auth/login-rate-limit-store.js`
- [X] T010 [P] Implement authentication audit repository in `src/infrastructure/db/repositories/auth-audit-repository.js`
- [X] T011 Create client auth repository over `clientes` in `src/infrastructure/db/repositories/client-auth-repository.js`
- [X] T012 Implement shared client auth service wiring repository, JWT and hash in `src/application/services/client-auth-service.js`
- [X] T013 Add client auth dependency container wiring in `src/infrastructure/config/container.js`
- [X] T014 Add database migration for client auth constraints/audit table in `src/infrastructure/db/migrations/002_client_auth.sql`
- [X] T015 Document migration rollback notes for auth schema in `specs/002-cliente-auth/research.md`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Registro de Cliente (Priority: P1) 🎯 MVP

**Goal**: Permitir registro de cliente con validacion de politica de contrasena y control de duplicados

**Independent Test**: Registrar un cliente nuevo y comprobar persistencia; intentar registro duplicado y validar conflicto consistente

### Tests for User Story 1

- [X] T016A [P] [US1] Add unit tests for password policy and register use case in `tests/unit/auth/register-client-use-case.test.js`
- [X] T016B [P] [US1] Add contract tests for `POST /api/v1/auth/register` in `tests/contract/http/auth-register.contract.test.js`
- [X] T016C [US1] Add integration tests for successful and duplicate register in `tests/integration/http/auth-register.integration.test.js`

- [X] T016 [P] [US1] Create register request/response DTO mappers in `src/application/dto/client-register-dto.js`
- [X] T017 [US1] Implement register use case with hash and duplicate guard in `src/application/use-cases/register-client-use-case.js`
- [X] T018 [P] [US1] Implement register controller with validation and generic errors in `src/api/http/v1/controllers/client-auth-register-controller.js`
- [X] T019 [P] [US1] Add register route `/api/v1/auth/register` in `src/api/http/v1/routes/client-auth-routes.js`
- [X] T020 [US1] Mount client auth routes in API router in `src/api/http/v1/routes/index.js`
- [X] T021 [US1] Add register success/failure audit logging flow in `src/application/services/client-auth-service.js`
- [X] T022 [US1] Align register endpoint contract examples in `specs/002-cliente-auth/contracts/auth-api.yaml`

**Checkpoint**: User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Login de Cliente (Priority: P2)

**Goal**: Autenticar clientes con respuesta uniforme, emision JWT de 1 hora y proteccion contra abuso

**Independent Test**: Login exitoso devuelve token valido; login invalido responde error generico; exceso de intentos responde rate-limit

### Tests for User Story 2

- [X] T023A [P] [US2] Add unit tests for login use case and generic auth failures in `tests/unit/auth/login-client-use-case.test.js`
- [X] T023B [P] [US2] Add contract tests for `POST /api/v1/auth/login` and `429` behavior in `tests/contract/http/auth-login.contract.test.js`
- [X] T023C [US2] Add integration tests for valid/invalid/rate-limited login in `tests/integration/http/auth-login.integration.test.js`

- [X] T023 [P] [US2] Create login request/response DTO mappers in `src/application/dto/client-login-dto.js`
- [X] T024 [US2] Implement login use case with generic failure semantics in `src/application/use-cases/login-client-use-case.js`
- [X] T025 [US2] Integrate rate-limit check and counters in login flow in `src/application/services/client-auth-service.js`
- [X] T026 [P] [US2] Implement login controller with generic auth message in `src/api/http/v1/controllers/client-auth-login-controller.js`
- [X] T027 [US2] Add login route `/api/v1/auth/login` in `src/api/http/v1/routes/client-auth-routes.js`
- [X] T028 [US2] Enforce 1h JWT claim generation in `src/infrastructure/auth/client-jwt-service.js`
- [X] T029 [US2] Add login success/failure audit logging fields (identifier/ip/reason) in `src/infrastructure/db/repositories/auth-audit-repository.js`
- [X] T030 [US2] Align login/rate-limit error contract examples in `specs/002-cliente-auth/contracts/auth-api.yaml`

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: User Story 3 - Integracion Segura con API y Realtime (Priority: P3)

**Goal**: Integrar identidad de cliente en recursos REST/WebSocket protegidos con politica coherente de autenticacion

**Independent Test**: Token valido permite acceso a ruta y canal protegido; token ausente/invalido es rechazado en ambos canales

### Tests for User Story 3

- [X] T031A [P] [US3] Add integration tests for protected REST route auth middleware in `tests/integration/http/protected-client-auth.integration.test.js`
- [X] T031B [US3] Add websocket auth integration tests for handshake success/failure in `tests/integration/socket/client-socket-auth.integration.test.js`

- [X] T031 [P] [US3] Implement client JWT extraction helper for HTTP/WebSocket in `src/shared/auth/client-token-extractor.js`
- [X] T032 [US3] Implement client auth middleware for protected REST routes in `src/api/http/v1/middlewares/client-auth-middleware.js`
- [X] T033 [US3] Attach client auth middleware to protected route groups in `src/api/http/v1/routes/protected-routes.js`
- [X] T034 [US3] Implement websocket client auth handshake middleware in `src/api/socket/v1/middlewares/client-socket-auth-middleware.js`
- [X] T035 [P] [US3] Wire protected namespace auth middleware in `src/api/socket/v1/gateways/protected-gateway.js`
- [X] T036 [US3] Add generic realtime auth failure handler in `src/api/socket/v1/handlers/auth-failure-handler.js`
- [X] T037 [US3] Register protected realtime gateway in socket bootstrap in `src/api/socket/v1/index.js`
- [X] T038 [US3] Update websocket auth contract with handshake/error semantics in `specs/002-cliente-auth/contracts/websocket-auth.md`
- [X] T039 [US3] Document protected endpoint usage with bearer token in `specs/002-cliente-auth/quickstart.md`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Hardening, validation, observability, and rollout confidence

- [X] T040 [P] Add auth endpoint/reference docs to Swagger setup in `src/infrastructure/config/swagger.js`
- [X] T041 [P] Add auth operational log redaction rules in `src/infrastructure/logging/security-log-policy.js`
- [X] T042 Add auth performance capture notes for SC-001/SC-002 in `specs/002-cliente-auth/perf/auth-latency-report.md`
- [X] T043 Add rate-limit and generic error evidence notes for SC-007/SC-008 in `specs/002-cliente-auth/perf/auth-security-report.md`
- [X] T044 Validate Docker startup for auth flow and log evidence in `specs/002-cliente-auth/quickstart.md`
- [X] T045 Run end-to-end quickstart and record final verification checklist in `specs/002-cliente-auth/quickstart.md`
- [X] T045A Run full auth test suites and record evidence in `specs/002-cliente-auth/quickstart.md` (`npm test -- tests/unit/auth tests/contract/http tests/integration/http tests/integration/socket`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories
- **User Story phases (Phase 3-5)**: Depend on Foundational completion
- **Polish (Phase 6)**: Depends on completion of all targeted stories

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2; no dependency on US2/US3
- **US2 (P2)**: Depends on foundational auth primitives and may reuse US1 route wiring
- **US3 (P3)**: Depends on issued JWT from US2 and protected route/socket infrastructure

### Within Each User Story

- DTO/contracts before controllers/use-cases when possible
- Use-case/service logic before route exposure
- Route/controller wiring before quickstart/contract finalization
- Story checkpoint verification before moving to next story

## Parallel Opportunities

- **Setup**: T003 and T004 can run in parallel
- **Foundational**: T006-T010 can run in parallel; T014 and T015 can run after repository decisions are stable
- **US1**: T018 and T019 can run in parallel after T017 starts
- **US2**: T026 and T028 can run in parallel after T024
- **US3**: T035 can run in parallel with T034 once T031 exists
- **Polish**: T040 and T041 can run in parallel
- **Testing tracks**: T016A/T016B, T023A/T023B, and T031A can run in parallel with implementation once their target endpoints/use-cases are available

## Parallel Example: User Story 1

```bash
Task: "T018 [US1] Implement register controller with validation and generic errors in src/api/http/v1/controllers/client-auth-register-controller.js"
Task: "T019 [US1] Add register route /api/v1/auth/register in src/api/http/v1/routes/client-auth-routes.js"
```

## Parallel Example: User Story 2

```bash
Task: "T026 [US2] Implement login controller with generic auth message in src/api/http/v1/controllers/client-auth-login-controller.js"
Task: "T028 [US2] Enforce 1h JWT claim generation in src/infrastructure/auth/client-jwt-service.js"
```

## Parallel Example: User Story 3

```bash
Task: "T034 [US3] Implement websocket client auth handshake middleware in src/api/socket/v1/middlewares/client-socket-auth-middleware.js"
Task: "T035 [US3] Wire protected namespace auth middleware in src/api/socket/v1/gateways/protected-gateway.js"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup)
2. Complete Phase 2 (Foundational)
3. Complete Phase 3 (US1)
4. Validate US1 independently using quickstart register scenarios
5. Demo/deploy MVP

### Incremental Delivery

1. Setup + Foundational provides secure auth foundation
2. Deliver US1 (register)
3. Deliver US2 (login + JWT + rate-limit)
4. Deliver US3 (REST/WebSocket protected integration)
5. Execute polish evidence tasks for SC metrics and deployment confidence

### Suggested MVP Scope

- Phase 1 + Phase 2 + Phase 3 (US1 only)
- This scope delivers first customer-visible value: account creation with secure persistence and validation
